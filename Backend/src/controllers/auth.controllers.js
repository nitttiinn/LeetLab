import bcrypt from 'bcryptjs'; // importing bcryptjs , used for password hashing
import jwt from 'jsonwebtoken'; // importing jwt ,  used for token generation 
import { db } from '../libs/db.js'; // Import the database connection
import { UserRole} from '../generated/prisma/index.js'; // Import the UserRole enum from the generated Prisma client
import nodemailer from 'nodemailer'; // used for sending emails
import crypto from 'crypto'; // used for generating random tokens

export const register = async (req, res) =>{
    const { name, email, password} = req.body; // Destructure the request body to get username, email and password

    if(!name || !email || !password){ // check for empty fields
        return res.status(400).json({
            message: "Please fill all the fields"
        })
    };
    
    if(password.length<6){
        return res.status(400).json({
            message: "Password must be at least 6 characters long"
        })
    };

    try {
        const existingUser = await db.user.findUnique({ // check if the user already exists in the database
            where:{
                email // check if the user alrady exists in the database
            }
        });

        if(existingUser){ // if user already exists , return error message
            return res.status(400).json({
                message: "User already exists"
            })
        };

        const hashedPassword = await bcrypt.hash(password, 10); // hash the password using brcypt
         
        const user = await db.user.create({
            data:{
                name,
                email,
                password: hashedPassword, // save the user in the database
                role: UserRole.USER // set the role of the user to USER
            }
        });

        const token = jwt.sign({id:user.id}, process.env.JWT_SECRET,{
            expiresIn: '1d' // token will expire in 1 day
        });

        res.cookie("jwt", token,{
            // set the cookie with the token
            httpOnly: true, // cookie is not accessible from client side
            sameSite: 'strict', // cookie is only sent to the same site
            secure: process.env.NODE_ENV !== 'development', // cookie is only sent to the secure site
            maxAge: 24*60*60*1000 // cookie will expire in 1 day
        });

        const verfiedToken = crypto.randomBytes(32).toString('hex'); // generate a random token for email verification
        
        await db.user.update({
            where:{
                id:user.id // update the user in the database with the verification token
            },
            data:{
                verificationToken: verfiedToken // set the verification token in the database
            }
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
            to: user.email,
            subject: "Email Verification for Registration",
            text: `Hello ${user.name},\n\n Please click on the following link to verify your email address: \n\n
            ${process.env.BASE_URL}/api/v1/auth/verify/${verfiedToken}\n\n`,
            html: `<p>Hello ${user.name},</p><p>Please click on the following link to verify your email address:</p>
            <a href="${process.env.BASE_URL}/api/v1/auth/verify/${verfiedToken}">Verify Email</a>`
        };

        await transporter.sendMail(mailOption); // send the email to the user

        // send the response to the client
        res.status(201).json({
            message: "User created Successfully, please check your email to verify your account",
            user: {
                id: user.id, 
                name: user.name,
                email: user.email,
                role:user.role,
                image: user.image,
                verificationToken: user.verificationToken,
                createdAt : user.createdAt
            }
        });
    } catch (error) {
        console.log("Some error occured", error); // log the error in the console.
        return res.status(500).json({
            message: "Internal Server Error",
            err,
            sucess: false
        })
    }
}

export const verify = async (req,res) =>{

}

export const login = async (req, res) =>{

}

export const logout = async (req, res) =>{

}
export const check = async (req, res) =>{

}