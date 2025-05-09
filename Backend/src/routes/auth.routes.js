import express from 'express';
import {register,login,logout,check,verify} from '../controllers/auth.controllers.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const authRoutes = express.Router();

// define the auth routes here

authRoutes.post('/register', register); // register a new user

authRoutes.get('/verify/:token', verify); // verify the email address of the user

authRoutes.post('/login', login);

authRoutes.post('/logout',authMiddleware,logout);

authRoutes.post('/profile',authMiddleware,check);

export default authRoutes;