import express from 'express';
import {register,login,logout,check,verify} from '../controllers/auth.controllers.js';

const authRoutes = express.Router();

// define the auth routes here

authRoutes.post('/register', register); // register a new user

authRoutes.get('/verify/:token', verify); // verify the email address of the user

authRoutes.post('/login', login);

authRoutes.post('/logout', logout);

authRoutes.post('/refresh', check);

export default authRoutes;