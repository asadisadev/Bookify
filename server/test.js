import dotenv from "dotenv";
import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

dotenv.config();

console.log(process.env.MONGO_URI);

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("Connected");
        process.exit();
    })
    .catch(err => {
        console.log(err);
        process.exit();
    });