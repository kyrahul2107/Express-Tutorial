import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

(async function () {
  // Configuration
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET,
  });

  // Function to upload a file to Cloudinary
  const uploadOnCloudinary = async (localFilePath) => {
    try {
      if (!localFilePath) {
        console.log("No file path provided.");
        return null;
      }
      // Upload the file to Cloudinary
      const response = await cloudinary.uploader.upload(localFilePath);
      console.log("File is uploaded on Cloudinary:", response.secure_url);

      // Return the uploaded file URL
      return response.secure_url;
    } catch (error) {
      console.log(`File is not uploaded. Error: ${error.message}`);
      // Remove the local file if upload fails
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
        console.log("Local file removed.");
      }
      return null;
    }
  };

  // Example usage of uploadOnCloudinary
  const filePath = "./example.jpg"; // Replace with your file path
  const uploadedUrl = await uploadOnCloudinary(filePath);
  console.log("Uploaded File URL:", uploadedUrl);

  // Optimize delivery by resizing and applying auto-format and auto-quality
  const optimizeUrl = cloudinary.url("shoes", {
    fetch_format: "auto",
    quality: "auto",
  });
  console.log("Optimized URL:", optimizeUrl);

  // Transform the image: auto-crop to square aspect ratio
  const autoCropUrl = cloudinary.url("shoes", {
    crop: "fill", // Changed from `auto` to `fill` for accurate cropping
    gravity: "auto",
    width: 500,
    height: 500,
  });
  console.log("Auto-cropped URL:", autoCropUrl);
})();
