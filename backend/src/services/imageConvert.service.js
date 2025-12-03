import sharp from "sharp";
import path from "path";
import fs from "fs";
import { promisify } from "util";
let heicConvert;
try {
  heicConvert = require("heic-convert");
} catch (e) {
  heicConvert = null;
}

/**
 * Converts an image to PNG format if not already PNG.
 * Returns the path to the PNG image (original if already PNG, otherwise new file).
 * @param {string} imagePath - Path to the input image file
 * @returns {Promise<string>} - Path to PNG image
 */
export async function convertImageToPng(imagePath) {
  const ext = path.extname(imagePath).toLowerCase();
  if (ext === ".png") {
    return imagePath;
  }
  const dir = path.dirname(imagePath);
  const base = path.basename(imagePath, ext || undefined); // Remove extension if present
  const pngPath = path.join(dir, base + ".png");
  // Only convert if PNG doesn't already exist
  if (!fs.existsSync(pngPath)) {
    let buffer;
    if ([".heic", ".heif"].includes(ext)) {
      if (!heicConvert) {
        throw new Error("heic-convert library is required to convert HEIC images. Please install it with 'npm install heic-convert'.");
      }
      const inputBuffer = fs.readFileSync(imagePath);
      buffer = await heicConvert({
        buffer: inputBuffer,
        format: "PNG",
        quality: 1
      });
      // Compress HEIC-converted images to below 300KB
      if (buffer.length > 300 * 1024) {
        let width = 1024;
        let quality = 80;
        let compressionLevel = 9;
        let attempts = 0;
        do {
          buffer = await sharp(buffer)
            .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
            .png({ quality, compressionLevel })
            .toBuffer();
          if (buffer.length <= 300 * 1024) break;
          // Reduce width and quality for next attempt
          width = Math.max(256, Math.floor(width * 0.8));
          quality = Math.max(30, Math.floor(quality * 0.8));
          attempts++;
        } while (buffer.length > 300 * 1024 && attempts < 10);
      }
    } else {
      // Try resizing and compressing until under 300KB
      let width = 1024;
      let quality = 80;
      let compressionLevel = 9;
      let attempts = 0;
      do {
        buffer = await sharp(imagePath)
          .resize({ width, height: width, fit: 'inside', withoutEnlargement: true })
          .png({ quality, compressionLevel })
          .toBuffer();
        if (buffer.length <= 300 * 1024) break;
        // Reduce width and quality for next attempt
        width = Math.max(256, Math.floor(width * 0.8));
        quality = Math.max(30, Math.floor(quality * 0.8));
        attempts++;
      } while (buffer.length > 300 * 1024 && attempts < 10);
    }
    await fs.promises.writeFile(pngPath, buffer);
  }
  return pngPath;
}
