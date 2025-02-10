import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

// Function to connect to the MongoDB database
const connectDB = async () => {
    try {
        // Construct the MongoDB URI using the environment variable and database name
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URI}/${DB_NAME}`,
            {
                useNewUrlParser: true,    // Use the new URL parser (recommended by Mongoose)
                useUnifiedTopology: true // Use the unified topology for connection
            }
        );
        console.log(`MongoDB connected: ${connectionInstance.connection.host}`);

    } catch (error) {
        console.log(`MongoDB connection error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
