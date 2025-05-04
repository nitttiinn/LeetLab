import express from 'express';
import {register,login,logout,check} from '../controllers/auth.controllers.js';

const authRoutes = express.Router();

// define the auth routes here

authRoutes.post('/register', register);

authRoutes.post('/login', login);

authRoutes.post('/logout', logout);

authRoutes.post('/refresh', check);

export default authRoutes;