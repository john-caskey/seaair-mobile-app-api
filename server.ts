/**
 * SeaAir Mobile App API
 * Transport layer for mobile app and controller communication
 */

import express, { Request, Response, NextFunction, Application } from 'express';
import morgan from 'morgan';
import { MessageQueue } from './src/messageQueue';
import { RateLimiter } from './src/rateLimiter';
import controllerRoutes from './src/routes/controller';
import mobileRoutes from './src/routes/mobile';
import { isCognitoConfigured, COGNITO_USER_POOL_ID, AWS_REGION } from './src/auth';
import { HealthResponse } from './src/types';

const app: Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(morgan('combined')); // Log all HTTP requests

// Initialize message queue and rate limiter
app.locals.messageQueue = new MessageQueue();
app.locals.rateLimiter = new RateLimiter();

console.log('[Server] Message queue and rate limiter initialized');

// Check AWS Cognito configuration
if (isCognitoConfigured()) {
  console.log(`[Server] AWS Cognito configured - User Pool: ${COGNITO_USER_POOL_ID}, Region: ${AWS_REGION}`);
} else {
  console.warn('[Server] WARNING: AWS Cognito not configured. Set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID in the configuration.');
  console.warn('[Server] Mobile app authentication will fail until Cognito is configured.');
}

// Routes
app.use('/controller', controllerRoutes);
app.use('/mobile', mobileRoutes);

// Health monitoring - log health data to console every minute
// Note: /health endpoint has been removed for security reasons (don't expose system information)
const logHealthData = (): void => {
  const stats = app.locals.messageQueue.getStats();
  const rateLimiterStats = app.locals.rateLimiter.getStats();
  
  const healthData: HealthResponse = {
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    queues: stats,
    rateLimiter: rateLimiterStats,
    cognito: {
      configured: isCognitoConfigured(),
      userPoolId: COGNITO_USER_POOL_ID || 'not-set',
      region: AWS_REGION
    }
  };

  console.log('[Health Monitor]', JSON.stringify(healthData, null, 2));
};

// Log health data every minute (60000 milliseconds)
// Note: The interval keeps the process alive, which is intentional for a long-running server
setInterval(logHealthData, 60000);

// 404 handler
app.use((req: Request, res: Response): void => {
  console.log(`[Server] 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Route not found' 
  });
});

// Error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction): void => {
  console.error('[Server] Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[Server] SeaAir Mobile App API running on port ${PORT}`);
  console.log(`[Server] Controller routes available at /controller`);
  console.log(`[Server] Mobile app routes available at /mobile`);
  console.log(`[Server] Health monitoring enabled (logs every 60 seconds)`);
});

export default app;
