import {v2 as cloudinary} from "cloudinary"
import fs from "fs"
import dotenv from "dotenv";
dotenv.config();

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath, folder) => {
    try {
        if (!localFilePath) return null

        const response = await cloudinary.uploader.upload(localFilePath, { folder ,
            resource_type: "auto"
        })

        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        return response.secure_url;

    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        if (fs.existsSync(localFilePath)) {
            fs.unlinkSync(localFilePath);
        }
        throw error;  
    }
}

const publicIdFromPath = (path) => {
    const match = path.match(/\/upload\/(?:v\d+\/)?(.+?)(\.[^/.]+)?$/);
    console.log("Match Result:", match);
    return match ? match[1] : null; 
}

const deleteFromCloudinary = async (path) => {
    const publicId = publicIdFromPath(path);
    try {
        const status =  await cloudinary.api.delete_resources([publicId]);
    } catch (error) {
        console.error("Error deleting from Cloudinary:", error);
        throw error;
    }
}
export {uploadOnCloudinary , publicIdFromPath, deleteFromCloudinary};