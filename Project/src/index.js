import express from "express"; 
import connectDB from "./db/index.js"; 
import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config();

// Connect to MongoDB and start the server
connectDB()
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port ${process.env.PORT || 8000}`);
        });
    })
    .catch((err) => {
        console.error("MongoDB connection failed:", err);
        process.exit(1);
    });
























    
// Define any middleware or routes here
// Example: app.use(express.json());

// import express from "express"
// const app = express()

//     (async () => {
//         try {
//             await mongoose.connect('${process.env.MONGODB_URI}/${DB_NAME}')
//             app.on("error", (error) => {
//                 console.log("Error:", error);
//                 throw error
//             })

//             app.listen(process.env.PORT, () => {
//                 console.log(`App is Listening on port ${process.env.PORT}`);

//             })
//         }
//         catch (error) {
//             console.error("Error", error);
//         }
//     })()