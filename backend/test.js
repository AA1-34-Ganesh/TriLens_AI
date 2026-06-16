import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => {
     
        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });