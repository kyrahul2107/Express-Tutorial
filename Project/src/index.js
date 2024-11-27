import express from "express"; // Import Express
import connectDB from "./db/index.js"; // Import the database connection function
import dotenv from "dotenv"; // Import dotenv to manage environment variables

dotenv.config(); // Load environment variables from .env file

const app = express(); // Initialize Express app

// Connect to MongoDB and start the server
connectDB()
    .then(() => {
        // Start the Express server after a successful DB connection
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running at port ${process.env.PORT || 8000}`);
        });
    })
    .catch((err) => {
        // Handle errors during DB connection
        console.error("MongoDB connection failed:", err);
        process.exit(1); // Exit the process with a failure code
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