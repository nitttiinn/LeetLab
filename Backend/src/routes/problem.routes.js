import express from 'express';
import { authMiddleware, checkAdmin } from '../middleware/auth.middleware.js';
import { createProblem } from '../controllers/problem.controllers.js';


const problemRoutes = express.Router(); // create a new router object using express Router() method

// creating routes for the problems
problemRoutes.get('/create-problem', authMiddleware, checkAdmin, createProblem); // create a new problem


export default problemRoutes; // export the router object