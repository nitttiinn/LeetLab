import jwt from "jsonwebtoken";
import {db} from "../libs/db.js";

export const authMiddleware = async (req, res, next) =>{
    const token = req.cookies.jwt;
    if(!token){
        return res.status(401).json({
            success: false,
            message: "Unauthorized!, Invalid token"
        })
    };
    try {
        let decoded;

        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized!, Invalid token"
            })
        }

        const user = await db.user.findUnique({
            where:{
                id: decoded.id
            },
            select:{
                id: true,
                name: true,
                email: true,
                role: true,
                image: true
            }
        });

        if(!user){
            return res.status(401).json({
                success: false,
                message: "Unauthorized!, User not found"
            })
        };

        req.user = user; // attach the user to the request object
        next(); // call the next middleware or route handler
    } catch(error){
        console.log(error);
        return res.status(401).json({
            success: false,
            message: "Unauthorized!, Invalid token"
        })
    }
}

export const checkAdmin = async(req,res,next) =>{
    try {
        const user = await db.user.findUnique({
            where:{
                id: req.user.id
            },
            select:{ // Only fetch the required fields,which in this case is role.
                role: true
            }
        });

        if(user.role !== "ADMIN"){
            return res.status(403).json({
                success: false,
                message: "Access denied!, You are not an admin"
            })
        };
        next(); // call the next middleware or route 
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            message: "Internal server error"
        })
    }
}