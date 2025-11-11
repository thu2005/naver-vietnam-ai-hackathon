import express from "express";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs";
import { extractIngredients } from "./ocrLogic.js";

dotenv.config();
const app = express();
const upload = multer({ dest: "uploads/" });

app.post("/scan-label", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: "No file uploaded. Please provide an image file with field name 'image'",
    });
  }

  const imagePath = req.file.path;

  try {
    const result = await extractIngredients(
      process.env.NAVER_OCR_SECRET_KEY,
      process.env.NAVER_OCR_API_URL,
      imagePath
    );

    fs.unlinkSync(imagePath); // cleanup
    res.json(result);
  } catch (err) {
    console.error(err.response?.data || err.message);
    
    // Cleanup file on error
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }
    
    res.status(500).json({
      success: false,
      error: err.message || "OCR processing failed",
    });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});
