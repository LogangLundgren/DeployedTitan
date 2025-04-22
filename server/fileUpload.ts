import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';

// Create uploads directory if it doesn't exist
const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Generate a unique filename to prevent collisions
function generateUniqueFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomString = crypto.randomBytes(8).toString('hex');
  const extension = path.extname(originalName);
  const safeName = path.basename(originalName, extension)
    .replace(/[^a-z0-9]/gi, '_')
    .toLowerCase();
  
  return `${safeName}_${timestamp}_${randomString}${extension}`;
}

// Simple middleware to handle base64 file uploads
export async function handleBase64Upload(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.body.media || !Array.isArray(req.body.media)) {
      return next();
    }

    const uploadedFiles: {
      originalName: string;
      fileName: string;
      filePath: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
      mimeType: string;
    }[] = [];

    // Process each media item
    for (const item of req.body.media) {
      if (!item.data || !item.name || !item.type) {
        continue;
      }

      // Extract base64 data
      const matches = item.data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        continue;
      }

      const mimeType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const fileSize = buffer.length;
      const originalName = item.name;
      const fileName = generateUniqueFileName(originalName);
      const filePath = path.join(uploadDir, fileName);
      
      // Determine file type (image or video)
      const fileType = mimeType.startsWith('image/') ? 'image' : 
                      mimeType.startsWith('video/') ? 'video' : 'other';

      // Only save if it's an image or video
      if (fileType === 'image' || fileType === 'video') {
        // Save the file
        await fs.promises.writeFile(filePath, buffer);
        
        // Create a public URL for the file
        const fileUrl = `/uploads/${fileName}`;
        
        uploadedFiles.push({
          originalName,
          fileName,
          filePath,
          fileUrl,
          fileType,
          fileSize,
          mimeType
        });
      }
    }

    // Attach the files to the request object
    req.body.uploadedFiles = uploadedFiles;
    next();
  } catch (error) {
    console.error('Error processing uploads:', error);
    return res.status(500).json({ message: 'Error processing file uploads' });
  }
}

// Middleware to serve static uploaded files
export function serveUploads(req: Request, res: Response, next: NextFunction) {
  const filePath = req.path.replace('/uploads/', '');
  const fullPath = path.join(uploadDir, filePath);
  
  // Security check to prevent directory traversal
  if (!fullPath.startsWith(uploadDir)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  
  res.sendFile(fullPath, (err) => {
    if (err) {
      res.status(404).json({ message: 'File not found' });
    }
  });
}