import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connDB = async () => {
    try {
        console.log(`${process.env.PORT}/${DB_NAME}`);        
        const connectionDB = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    } catch (error) {
        console.log("DB Connection Error", error);
        process.exit(1);
    }

}
export default connDB