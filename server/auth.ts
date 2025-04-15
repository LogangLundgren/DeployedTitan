import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';
import { scrypt, randomBytes, timingSafeEqual } from 'crypto';
import { promisify } from 'util';
import session from 'express-session';
import type { User } from '@shared/schema';

// For TypeScript to recognize the user property on the Request object
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Extend express-session with our custom fields
declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

// Convert callback-based scrypt to Promise-based
const scryptAsync = promisify(scrypt);

// Hash password function that returns hash.salt format
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return `${derivedKey.toString('hex')}.${salt}`;
}

// Verify password against stored hash
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const [hash, salt] = hashedPassword.split('.');
  const keyBuffer = Buffer.from(hash, 'hex');
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  return timingSafeEqual(keyBuffer, derivedKey);
}

// Authentication middleware
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Check if user is logged in via session
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  next();
}

// Data ownership middleware - ensures users can only access their own data
export function requireOwnership(req: Request, res: Response, next: NextFunction) {
  // First ensure the user is authenticated
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  // Get the userId from the request (query for GET, body for POST/PUT)
  const requestUserId = req.query.userId || req.body.userId;
  
  // If userId is provided in the request, ensure it matches the authenticated user
  if (requestUserId && parseInt(requestUserId as string) !== req.session.userId) {
    return res.status(403).json({ 
      message: 'Access denied. You can only access your own data.' 
    });
  }
  
  // If no userId provided, set it to the authenticated user's ID
  if (req.method === 'GET') {
    req.query.userId = req.session.userId.toString();
  } else {
    req.body.userId = req.session.userId;
  }
  
  next();
}

// Current user middleware that attaches the user to the request object
export async function currentUser(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return next();
  }
  
  try {
    const user = await storage.getUser(parseInt(req.session.userId.toString()));
    if (user) {
      req.user = user;
    }
  } catch (error) {
    console.error('Error loading user:', error);
  }
  
  next();
}

// Setup session middleware
export function configureSession(app: any) {
  const sessionConfig: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || 'titan-fitness-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    }
  };
  
  // If using PostgreSQL database, configure session store
  if (process.env.DATABASE_URL) {
    try {
      // We'll use a simpler in-memory store for now
      // Later, we can set up proper database storage for sessions if needed
      const MemoryStore = session.MemoryStore;
      sessionConfig.store = new MemoryStore();
      console.log("Using memory store for sessions");
    } catch (error) {
      console.error('Failed to initialize session store:', error);
    }
  }
  
  app.use(session(sessionConfig));
  app.use(currentUser);
}