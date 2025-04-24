// Simple error monitoring system for beta testing

export interface ErrorData {
  message: string;
  stack?: string;
  componentStack?: string | null;
  url: string;
  timestamp: string;
  userId?: number;
  userAgent: string;
}

class ErrorMonitor {
  private storageKey = 'titan-fitness-errors';
  private initialized = false;
  
  /**
   * Initialize the error monitoring system
   */
  initialize() {
    if (this.initialized) return;
    
    // Capture unhandled exceptions
    window.addEventListener('error', (event) => {
      this.captureError({
        message: event.message,
        stack: event.error?.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    });
    
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError({
        message: typeof event.reason === 'string' ? event.reason : 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
    });
    
    // Override console.error to capture errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Call the original console.error
      originalConsoleError.apply(console, args);
      
      // Capture the error
      if (args.length > 0) {
        const firstArg = args[0];
        if (firstArg instanceof Error) {
          this.captureError({
            message: firstArg.message,
            stack: firstArg.stack,
            url: window.location.href,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          });
        } else if (typeof firstArg === 'string') {
          this.captureError({
            message: args.join(' '),
            url: window.location.href,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          });
        }
      }
    };
    
    this.initialized = true;
    console.log('Error monitoring initialized');
  }
  
  /**
   * Manually capture an error
   */
  captureError(error: ErrorData) {
    try {
      // Get existing errors from local storage
      const existingErrors = this.getErrors();
      
      // Add the new error
      existingErrors.push(error);
      
      // Limit to 100 most recent errors to prevent storage issues
      const limitedErrors = existingErrors.slice(-100);
      
      // Save back to local storage
      localStorage.setItem(this.storageKey, JSON.stringify(limitedErrors));
      
      // In a production environment, you would send this to a server endpoint
      // this.sendErrorToServer(error);
    } catch (e) {
      // Fallback in case localStorage fails
      console.warn('Failed to store error', e);
    }
  }
  
  /**
   * Get all stored errors
   */
  getErrors(): ErrorData[] {
    try {
      const errors = localStorage.getItem(this.storageKey);
      return errors ? JSON.parse(errors) : [];
    } catch (e) {
      console.warn('Failed to get errors', e);
      return [];
    }
  }
  
  /**
   * Clear all stored errors
   */
  clearErrors() {
    localStorage.removeItem(this.storageKey);
  }
  
  /**
   * Future implementation: send errors to a server endpoint
   */
  // private sendErrorToServer(error: ErrorData) {
  //   fetch('/api/errors', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(error)
  //   }).catch(e => console.warn('Failed to send error to server', e));
  // }
}

// Singleton instance
export const errorMonitor = new ErrorMonitor();

// React error boundary component
export function initializeErrorMonitoring() {
  errorMonitor.initialize();
}