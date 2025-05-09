import bcrypt from 'bcryptjs'; // importing bcryptjs , used for password hashing
import jwt from 'jsonwebtoken'; // importing jwt ,  used for token generation 
import {db} from '../libs/db.js'; // Import the database connection
import {UserRole} from '../generated/prisma/index.js'; // Import the UserRole enum from the generated Prisma client
import nodemailer from 'nodemailer'; // used for sending emails
import crypto from 'crypto'; // used for generating random tokens

export const register = async (req, res) =>{
    // Destructure the request body to get username, email and password
    const { name, email, password} = req.body;

     // check for empty fields
    if(!name || !email || !password){        
        return res.status(400).json({
            message: "Please fill all the fields"
        })
    };
    
    // check for valid password
    if(password.length<6){
        return res.status(400).json({
            message: "Password must be at least 6 characters long"
        })
    };

    try {

        // check if the user already exists in the database
        const existingUser = await db.user.findUnique({ 
            where:{
                email
            }
        });

        // if user already exists , return error message
        if(existingUser){ 
            return res.status(400).json({
                message: "User already exists"
            })
        };

        // hash the password using brcypt
        const hashedPassword = await bcrypt.hash(password, 10); 

        const verfiedToken = crypto.randomBytes(32).toString('hex'); // generate a random token for email verification
        // console.log(verfiedToken); // log the token in the console
         
        const newUser = await db.user.create({
            data:{
                name,
                email,
                password: hashedPassword, // save the user in the database
                role: UserRole.USER, // set the role of the user to USER
                verificationToken: verfiedToken, // save the verification token in the database
                verified: false, // set the verified field to false
            }
        });

        const token = jwt.sign({id:newUser.id}, process.env.JWT_SECRET,{
            expiresIn: '1d' // token will expire in 1 day
        });

        res.cookie("jwt", token,{
            // set the cookie with the token
            httpOnly: true, // cookie is not accessible from client side
            sameSite: 'strict', // cookie is only sent to the same site
            secure: process.env.NODE_ENV !== 'development', // cookie is only sent to the secure site
            maxAge: 24*60*60*1000 // cookie will expire in 1 day
        });


        // send email to the user with the verification token
        const transporter = nodemailer.createTransport({
            host: process.env.MAILTRAP_HOST,
            port: process.env.MAILTRAP_HOST_PORT,
            secure: false,
            auth:{
                user: process.env.MAILTRAP_USER,
                pass: process.env.MAILTRAP_PASSWORD
            }
        });

        // MAIL OPTIONS
        const mailOption = {
            from : process.env.MAILTRAP_SENDERMAIL,
            to: newUserser.email,
            subject: "Email Verification for Registration",
            text: `Hello ${newUser.name},\n\n Please click on the following link to verify your email address: \n\n
            ${process.env.BASE_URL}/api/v1/auth/verify/${verfiedToken}\n\n`,
            html: `<p>Hello ${newUser.name},</p><p>Please click on the following link to verify your email address:</p>
            <a href="${process.env.BASE_URL}/api/v1/auth/verify/${verfiedToken}">Verify Email</a>`
        };

        await transporter.sendMail(mailOption); // send the email to the user

        // send the response to the client
        res.status(201).json({
            message: "User created Successfully, please check your email to verify your account",
            user: {
                id: newUser.id, 
                name: newUser.name,
                email: newUser.email,
                role:newUser.role,
                image: newUser.image,
                verificationToken: newUser.verificationToken,
                createdAt : newUser.createdAt
            }
        });
    } catch (error) {
        console.log("Some error occured", error); // log the error in the console.
        return res.status(500).json({
            message: "Internal Server Error",
            error,
            sucess: false
        })
    }
}


export const verify = async (req,res) =>{
    /*
    1. get the token from the url
    2. validate token
    3. if valid, find the user in the database
    4. if user found, update the verified to true
    5. remove verification token from the database
    6. save the user in the databse
    7. send the respose to the client
    */
    const {token} = req.params; // 1.

    if(!token){ // 2.
        return res.status(400).json({
            message: "Invalid token"
        });
    };

    try{
        const user = await db.user.findUnique({
            where:{
                verificationToken: token // 3
            }
        });

        if(!user){
            return res.status(400).json({
                message: "Invalid token"
            })
        };

        await db.user.update({ // 6.
            where:{
                id: user.id 
            },
            data:{
                verified: true, // 4.
                verificationToken: null // 5.
            }
        });


        res.status(200).json({
            message: "Email verified successfully",// 7.
            success: true
        })

    } catch(error){
        console.log("Some error occured", error);
        return res.status(500).json({
            message: "Internal Server Error"
        })
    }
}


export const login = async (req, res) =>{
    /*
    1. get the email and password from the request body
    2. check for empty fields
    3. check if the user exists in the database
    4. if exists ,  check if the user is verified or not
    5. check if the password or email is correct,if not correct, return error message.
    6. if correct, generate a token and send the response to the client
    7. set the cookie with the token
    9. maxAge of the cookie is 1 day
    10. send the response to the client with the user details
    11. if any erro occcurs, log the error in the console and return the error message to the client   
    */

    // 1.
    const {email, password} = req.body;

    // 2.
    if(!email || !password){
        return res.status(400).json({
            message: "Please fill all the fields"
        })
    }

    try {
        // 3.
        const user = await db.user.findUnique({
            where:{
                email
            }
        });
        if(!user){
            return res.status(400).json({
                message: "User doesn't exist, register yourself first!"
            })
        };

        // 4.
        if(!user.verified){
            return res.status(400).json({
                message: "Please verify your email address first",
                user:{
                    verified: user.verified
                }
            });
        };

        // 5.
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if(!isPasswordCorrect){
            return res.status(400).json({
                message: "Invalid credentials" 
            });
        };

        // 6.
        const token = jwt.sign({
            id: user.id,
            email:user.email,
            role: user.role
        }, process.env.JWT_SECRET,
        { expiresIn: '24h'}) // token will expire in 1 day

        // 7.
        const cookieOptions = {
            httpOnly: true, // cookie is not accessible from clinet side
            sameSite: "strict", // cookie is only sent to the same site
            secure: process.env.NODE_ENV !== "development", // cookie process.env.NODE_ENV !== "development" ? true : false, // cookie is only sent to the secure site
            maxAge: 24*60*60*1000 // cookie will expire in 1 day
        };

        res.cookie("jwt", token,cookieOptions); // set the cookie with the token

        res.status(200).json({
            message: "login Scuccessfully",
            user:{
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                image: user.image,
                createdAt : user.createdAt
            },
            success: true
        })
    } catch (error) {
        console.log("Some error occured", error); // log the error in the console.
        return res.status(500).json({
            message: "Internal Server Error",
            error,
            sucess: false
        })
    }
}


export const logout = async (req, res) =>{
    /*
    how to logout the user
    1. clear the cookie with the token
    2. send the response to the client
    3. if any error occurs, log the error in the console and return the error message to the client
    */
    try {
        // 1.
        res.clearCookie("jwt",{
            httpOnly: true,
            secure: process.env.NODE_ENV !== "development",
            sameSite: "strict",
        })

        // 2. 
        return res.status(200).json({
            message: "Logout Successfully",
            success: true
        })
    } catch (error) {
        console.log("Some error occured", error); // log the error in the console.
        return res.status(500).json({
            message: "Internal Server Error",
            error,
            sucess: false
        })
    }
}


export const check = async (req, res) =>{
    /*
    1. get the JWT token from the cookie, by using req.cookies.jwt
    2. verify the token using jwt.verify() method
    3. decode the token to get th user id and email by using jwt.decode() method
    */
   try {
        res.status(200).json({
            message: "User authenticated Successfully!",
            user: req.user, // get the user from the request object
            success: true
        });
   } catch (error) {
        console.log("some error occured", error); // log the error in the console.
        return res.status(500).json({
            message: "Internal Servrer Error",
            error,
            success: false
        })
   }
}