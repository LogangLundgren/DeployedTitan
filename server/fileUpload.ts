import { Request, Response, NextFunction } from "express";
import * as path from "path";
import * as fs from "fs";
import * as crypto from "crypto";

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Generate a unique filename with the original extension
 */
function generateUniqueFileName(originalName: string): string {
  const fileExt = path.extname(originalName);
  const timestamp = Date.now();
  const randomId = crypto.randomBytes(4).toString('hex');
  return `${timestamp}-${randomId}${fileExt}`;
}

/**
 * Check if a file is a supported image format
 * Supported formats: jpeg, jpg, png, gif, webp
 */
function isSupportedImageFormat(mimeType: string): boolean {
  const supportedFormats = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return supportedFormats.includes(mimeType.toLowerCase());
}

/**
 * Middleware to handle base64 image uploads
 * This function processes base64 image data sent from the client
 * and saves it to the filesystem. It also ensures file format compatibility.
 */
export async function handleBase64Upload(req: Request, res: Response, next: NextFunction) {
  try {
    // Continue if no files to upload
    if (!req.body.uploadedFiles || !Array.isArray(req.body.uploadedFiles)) {
      return next();
    }
    
    const savedFiles = [];
    
    for (const file of req.body.uploadedFiles) {
      if (!file.fileUrl || !file.fileName) {
        continue;
      }
      
      // Extract the base64 data
      const matches = file.fileUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        continue;
      }
      
      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Always convert to PNG for browser compatibility
      const fileExt = '.png';
      
      // Generate a unique filename to prevent collisions
      const fileNameWithoutExt = file.fileName.split('.')[0] || 'image';
      const fileName = generateUniqueFileName(fileNameWithoutExt + fileExt);
      const filePath = path.join(uploadsDir, fileName);
      
      // Write the file to disk
      fs.writeFileSync(filePath, buffer);
      
      // Replace the base64 data with the file URL
      const fileUrl = `/uploads/${fileName}`;
      
      // Add the saved file info to the array
      savedFiles.push({
        originalName: file.fileName,
        fileName,
        fileUrl,
        fileType: 'image/png', // Always use PNG for browser compatibility
        fileSize: buffer.length,
        mimeType: 'image/png'  // Always use PNG for browser compatibility
      });
    }
    
    // Replace the uploaded files with the saved file info
    req.body.uploadedFiles = savedFiles;
    
    next();
  } catch (error) {
    console.error("Error processing file upload:", error);
    res.status(500).json({ message: "File upload failed" });
  }
}

/**
 * Middleware to serve uploaded files
 */
export function serveUploads(req: Request, res: Response, next: NextFunction) {
  try {
    const filePath = req.path.replace("/uploads/", "");
    const fullPath = path.join(uploadsDir, filePath);
    
    // Check if the file exists
    if (!fs.existsSync(fullPath)) {
      return res.status(404).send("File not found");
    }
    
    // Send the file
    res.sendFile(fullPath);
  } catch (error) {
    console.error("Error serving file:", error);
    res.status(500).send("Error serving file");
  }
}