/**
 * SeaAir Mobile App API
 * Transport layer for mobile app and controller communication
 */

const express = require('express');
const morgan = require('morgan');
const MessageQueue = require('./src/messageQueue');
const RateLimiter = require('./src/rateLimiter');
const controllerRoutes = require('./src/routes/controller');
const mobileRoutes = require('./src/routes/mobile');
const { isCognitoConfigured, COGNITO_USER_POOL_ID, AWS_REGION } = require('./src/auth');

const app = express();
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
  console.warn('[Server] WARNING: AWS Cognito not configured. Set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID environment variables.');
  console.warn('[Server] Mobile app authentication will fail until Cognito is configured.');
}

// Routes
app.use('/controller', controllerRoutes);
app.use('/mobile', mobileRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const stats = app.locals.messageQueue.getStats();
  const rateLimiterStats = app.locals.rateLimiter.getStats();
  
  res.status(200).json({
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
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`[Server] 404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ 
    error: 'Route not found' 
  });
});

// Error handler
app.use((err, req, res, next) => {
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
  console.log(`[Server] Health check available at /health`);
});

module.exports = app;
