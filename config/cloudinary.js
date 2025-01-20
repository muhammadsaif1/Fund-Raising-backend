const cloudinary = require("cloudinary").v2;
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_API_KEY,
  api_secret: process.env.CLOUD_API_SECRET,
});

const storage = new multer.memoryStorage();

async function ImageUploadUtils(file) {
  if (!file) {
    throw new Error("No file provided for upload");
  }
  const result = await cloudinary.uploader.upload(file, {
    resource_type: "auto",
  });
  return result.secure_url;
}

const upload = multer({ storage });

module.exports = { upload, ImageUploadUtils };
