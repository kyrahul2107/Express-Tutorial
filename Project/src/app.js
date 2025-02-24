import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app=express()

app.use(cors({
    origin:process.env.CROS_ORIGIN,
    credentials:true
}))

// Setting up configuration for json data to be not more than 16kb
app.use(express.json({limit:"16kb"}))
// Setting up configuration for url encoded data
app.use(express.urlencoded({extended:true,limit:"16kb"}))
// Configuration  for static file 
app.use(express.static("public"))
app.use(cookieParser())




// routes import
import userRouter from './routes/user.route.js';


// routes declaration
app.use("/api/v1/users",userRouter)
export {app}