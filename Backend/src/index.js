import express from 'express'; // import express framework , which is used for building web applications in node.js
import dotenv from 'dotenv'; // import dotenv , which is used for loading environment variables from .env file
import cookieParser from 'cookie-parser'; // import cookie-parser , which is used for parsing cookies in the request
import authRoutes from './Routes/auth.routes.js'; // import auth routes from auth.routes.js file


dotenv.config(); // load enviroment variables from .env file


const app = express(); // Create an instance of express or Intialize express app
app.use(express.json()); // parse incoming JSON requests or accept json data in the request body
app.use(cookieParser()); // parse cookies in the request


const port = process.env.PORT || 8080; 

app.get('/', (req,res)=>{ // Define a route for the root uRL 
    res.send("Hello World! Welcome to the LeetLab 🔥"); // Send the response 
})

app.use("/api/v1/auth", authRoutes);

app.listen(port,()=>{
    console.log("Server is running on port 8080");
})