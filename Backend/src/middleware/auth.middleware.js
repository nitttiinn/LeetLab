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