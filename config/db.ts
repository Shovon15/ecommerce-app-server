import mongoose from "mongoose";
import { mongoDbUrl } from "../secret";

const connectDB = async (options = {}) => {
    try {
        await mongoose.connect(mongoDbUrl, options).then((data) => {
            console.log(`DB connect successful!! with ${data.connection.host}`);
        });
        // console.log(`DB connect successfully!!! `);

        mongoose.connection.on("error", (error: Error) => {
            console.error("DB connection error", error);
        });
    } catch (error: any) {
        console.error("Could not connect to DB", error.toString());
        setTimeout(connectDB, 5000)
    }
};
export default connectDB;


