import { v2 as cloudinary } from "cloudinary";
import { log } from "console";
import { response } from "express";
import fs from "fs"; // Inbuilt filesystem in nodejs

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// This code will upload the files that is currently saved on the local server on the cloudinary

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // File has been uploaded successfully
    // console.log("File has been uploaded successfully", response.url);
    fs.unlinkSync(localFilePath); // File uploaded successfully so, remove it from local server
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath);
    //Removes the files from the server as it may harm the system
    return null;
  }
};

export { uploadOnCloudinary };
