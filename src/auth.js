/**
 * JWT Authentication Middleware
 * Validates JWT tokens for mobile app routes
 */

const jwt = require('jsonwebtoken');

// JWT secret - in production, this should be an environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * Middleware to verify JWT token
 */
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    console.log('[Auth] No authorization header provided');
    return res.status(401).json({ 
      error: 'No authorization header provided',
      message: 'Authorization header with Bearer token is required'
    });
  }

  // Expected format: "Bearer <token>"
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    console.log('[Auth] Invalid authorization header format');
    return res.status(401).json({ 
      error: 'Invalid authorization header format',
      message: 'Expected format: Bearer <token>'
    });
  }

  const token = parts[1];

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Attach decoded token to request for use in routes
    req.auth = decoded;
    
    console.log(`[Auth] JWT verified for user: ${decoded.sub || decoded.userId || 'unknown'}`);
    
    next();
  } catch (error) {
    console.log(`[Auth] JWT verification failed: ${error.message}`);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'JWT token has expired'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'JWT token is invalid'
      });
    }
    
    return res.status(401).json({ 
      error: 'Authentication failed',
      message: error.message
    });
  }
}

/**
 * Generate a JWT token (for testing purposes)
 * In production, this would be done by AWS Cognito
 */
function generateToken(userId, expiresIn = '24h') {
  return jwt.sign(
    { 
      sub: userId,
      userId: userId,
      iss: 'seaair-api'
    },
    JWT_SECRET,
    { expiresIn }
  );
}

module.exports = {
  verifyJWT,
  generateToken,
  JWT_SECRET
};
