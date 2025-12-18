/**
 * AWS Cognito JWT Authentication Middleware
 * Validates JWT tokens issued by AWS Cognito for mobile app routes
 */

const { CognitoJwtVerifier } = require('aws-jwt-verify');

// AWS Cognito configuration from environment variables
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// Create Cognito JWT verifier instance
let verifier = null;

/**
 * Initialize the Cognito JWT verifier
 * This is called lazily on first use to allow configuration at runtime
 */
function initializeVerifier() {
  if (!COGNITO_USER_POOL_ID || !COGNITO_CLIENT_ID) {
    throw new Error(
      'AWS Cognito configuration missing. Please set COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID environment variables.'
    );
  }

  if (!verifier) {
    verifier = CognitoJwtVerifier.create({
      userPoolId: COGNITO_USER_POOL_ID,
      tokenUse: 'access', // or 'id' depending on which token type you want to verify
      clientId: COGNITO_CLIENT_ID,
    });
    
    console.log(`[Auth] Cognito JWT verifier initialized for User Pool: ${COGNITO_USER_POOL_ID}, Region: ${AWS_REGION}`);
  }
  
  return verifier;
}

/**
 * Middleware to verify AWS Cognito JWT token
 */
async function verifyJWT(req, res, next) {
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
    // Initialize verifier if needed
    const cognitoVerifier = initializeVerifier();
    
    // Verify the token against AWS Cognito
    const payload = await cognitoVerifier.verify(token);
    
    // Attach decoded token to request for use in routes
    // Cognito tokens have 'sub' as the unique user identifier
    req.auth = {
      sub: payload.sub,
      username: payload.username || payload['cognito:username'],
      email: payload.email,
      ...payload
    };
    
    console.log(`[Auth] Cognito JWT verified for user: ${payload.sub} (${payload.username || payload['cognito:username'] || 'unknown'})`);
    
    next();
  } catch (error) {
    console.log(`[Auth] Cognito JWT verification failed: ${error.message}`);
    
    // Handle specific error cases
    if (error.message.includes('Token expired')) {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'JWT token has expired. Please refresh your token.'
      });
    }
    
    if (error.message.includes('Token use invalid')) {
      return res.status(401).json({ 
        error: 'Invalid token type',
        message: 'Expected an access token from AWS Cognito'
      });
    }
    
    if (error.message.includes('configuration missing')) {
      console.error('[Auth] AWS Cognito not configured. Check environment variables.');
      return res.status(500).json({ 
        error: 'Authentication service not configured',
        message: 'Server authentication configuration is incomplete'
      });
    }
    
    return res.status(401).json({ 
      error: 'Authentication failed',
      message: 'Invalid or malformed JWT token'
    });
  }
}

/**
 * Check if AWS Cognito is properly configured
 */
function isCognitoConfigured() {
  return !!(COGNITO_USER_POOL_ID && COGNITO_CLIENT_ID);
}

module.exports = {
  verifyJWT,
  isCognitoConfigured,
  COGNITO_USER_POOL_ID,
  COGNITO_CLIENT_ID,
  AWS_REGION
};
