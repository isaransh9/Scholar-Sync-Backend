import { v2 as cloudinary } from 'cloudinary';
import { log } from 'console';
import { response } from 'express';
import fs from 'fs'; // Inbuilt filesystem in nodejs

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// This code will upload the files that is currently saved on the local server on the cloudinary

// Direct Code and it will work (Approach 1)
// cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" },
//   function(error, result) {console.log(result); });


// Approach 2, production level
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
}

export { uploadOnCloudinary }