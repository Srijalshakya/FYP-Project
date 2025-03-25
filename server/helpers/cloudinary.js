const cloudinary = require("cloudinary").v2;
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dxkvub6u7", 
  api_key: "412924136629689", 
  api_secret: "PsRsbFhn9Wo7qr89N7QMpLr4Ano", 
});

// Multer storage configuration
const storage = new multer.memoryStorage();
const upload = multer({ storage });

// Utility function to upload image to Cloudinary
async function imageUploadUtil(fileBuffer, mimeType) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto", // Automatically detect the file type
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    // Convert buffer to a readable stream
    const stream = require("stream");
    const bufferStream = new stream.PassThrough();
    bufferStream.end(fileBuffer);
    bufferStream.pipe(uploadStream);
  });
}

module.exports = { upload, imageUploadUtil };