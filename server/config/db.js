import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
    try {
        // Check if MONGO_URI exists
        if (!process.env.MONGO_URI) {
            console.error("❌ MONGO_URI is not defined in environment variables");
            console.error("Please check your .env file and make sure MONGO_URI is set");
            process.exit(1);
        }

        console.log("📝 Attempting to connect to MongoDB...");
        
        // Updated connection options (removed deprecated options)
        const options = {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            family: 4,
        };

        await mongoose.connect(process.env.MONGO_URI, options);

        console.log("✅ MongoDB Connected Successfully");
        console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
        console.log(`🔗 Host: ${mongoose.connection.host}`);
        
    } catch (error) {
        console.error("❌ MongoDB Connection Failed");
        console.error(`Error: ${error.message}`);
        
        // Provide helpful error messages based on error type
        if (error.message.includes('bad auth')) {
            console.error("\n💡 Authentication Error:");
            console.error("Your MongoDB username or password is incorrect.");
            console.error("Please check your MONGO_URI in the .env file.");
        } else if (error.name === 'MongoServerSelectionError') {
            console.error("\n💡 Connection Error:");
            console.error("1. Make sure MongoDB is running locally or check your Atlas connection string");
            console.error("2. Check if your IP is whitelisted in MongoDB Atlas");
            console.error("3. Verify your network connection");
        }
        
        process.exit(1);
    }
};

export default connectDB;