import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";
import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import { configureSession } from "./auth";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure authentication session
configureSession(app);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Initialize the database
async function initializeDb() {
  if (process.env.DATABASE_URL) {
    log('Initializing database...');
    
    // Configure Neon serverless with WebSocket support
    neonConfig.webSocketConstructor = ws;
    
    try {
      // Initialize the database with seed data if needed
      if ('initialize' in storage) {
        await storage.initialize();
        log('Database initialized with seed data');
      }
    } catch (error) {
      log(`Database initialization error: ${error}`);
      throw error;
    }
  }
}

(async () => {
  // Initialize the database first
  if (process.env.DATABASE_URL) {
    await initializeDb();
  }
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
