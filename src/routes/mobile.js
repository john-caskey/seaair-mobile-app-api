/**
 * Mobile App Routes
 * Routes used by the mobile application
 * Requires JWT authentication
 */

const express = require('express');
const router = express.Router();
const { verifyJWT } = require('../auth');

/**
 * POST /mobile/message
 * Mobile app sends message to controller
 * Requires JWT authentication
 * Body: {
 *   controllerId: string (required),
 *   protobufPayload: string (base64 encoded protobuf)
 * }
 */
router.post('/message', verifyJWT, (req, res) => {
  const { controllerId, protobufPayload } = req.body;
  const ip = req.ip || req.connection.remoteAddress;
  const authId = req.auth.sub || req.auth.userId;

  console.log(`[Mobile] Message received from user ${authId} at ${ip} for controller ${controllerId}`);
  console.log(`[Mobile] Payload:`, JSON.stringify(req.body, null, 2));

  // Validate required fields
  if (!controllerId) {
    console.log('[Mobile] Error: controllerId is required');
    return res.status(400).json({ 
      error: 'controllerId is required' 
    });
  }

  if (!protobufPayload) {
    console.log('[Mobile] Error: protobufPayload is required');
    return res.status(400).json({ 
      error: 'protobufPayload is required' 
    });
  }

  // Rate limiting check - track per account and per IP to any controller
  const authRateLimitKey = `auth:${authId}`;
  if (!req.app.locals.rateLimiter.checkLimit(authRateLimitKey)) {
    console.log(`[Mobile] Rate limit exceeded for user ${authId}`);
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests from this account. Maximum 25 requests per 30 seconds.'
    });
  }

  // Also check rate limiting by IP
  const ipRateLimitKey = `ip:${ip}`;
  if (!req.app.locals.rateLimiter.checkLimit(ipRateLimitKey)) {
    console.log(`[Mobile] Rate limit exceeded for IP ${ip}`);
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP. Maximum 25 requests per 30 seconds.'
    });
  }

  // Record this request for both auth and IP rate limiting
  req.app.locals.rateLimiter.recordRequest(authRateLimitKey);
  req.app.locals.rateLimiter.recordRequest(ipRateLimitKey);

  // Create message object
  const message = {
    timestamp: new Date().toISOString(),
    sender: {
      ip: ip,
      type: 'mobile',
      authId: authId
    },
    controllerId: controllerId,
    protobufPayload: protobufPayload
  };

  // Add to mobile app queue
  req.app.locals.messageQueue.addMobileAppMessage(controllerId, message);

  res.status(200).json({ 
    success: true,
    message: 'Message queued for controller',
    controllerId: controllerId
  });
});

/**
 * GET /mobile/status/:controllerId
 * Mobile app retrieves latest controller status
 * Requires JWT authentication
 */
router.get('/status/:controllerId', verifyJWT, (req, res) => {
  const { controllerId } = req.params;
  const ip = req.ip || req.connection.remoteAddress;
  const authId = req.auth.sub || req.auth.userId;

  console.log(`[Mobile] Status request from user ${authId} at ${ip} for controller ${controllerId}`);

  if (!controllerId) {
    return res.status(400).json({ 
      error: 'controllerId is required' 
    });
  }

  // Rate limiting check - track per account and per IP
  const authRateLimitKey = `auth:${authId}`;
  if (!req.app.locals.rateLimiter.checkLimit(authRateLimitKey)) {
    console.log(`[Mobile] Rate limit exceeded for user ${authId}`);
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests from this account. Maximum 25 requests per 30 seconds.'
    });
  }

  // Also check IP rate limiting
  const ipRateLimitKey = `ip:${ip}`;
  if (!req.app.locals.rateLimiter.checkLimit(ipRateLimitKey)) {
    console.log(`[Mobile] Rate limit exceeded for IP ${ip}`);
    return res.status(429).json({ 
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP. Maximum 25 requests per 30 seconds.'
    });
  }

  // Record this request for both auth and IP rate limiting
  req.app.locals.rateLimiter.recordRequest(authRateLimitKey);
  req.app.locals.rateLimiter.recordRequest(ipRateLimitKey);

  // Retrieve controller status message
  const message = req.app.locals.messageQueue.getControllerMessage(controllerId);

  if (!message) {
    console.log(`[Mobile] No status available for controller ${controllerId}`);
    return res.status(404).json({ 
      success: false,
      message: 'No status available for this controller'
    });
  }

  console.log(`[Mobile] Returning status for controller ${controllerId}`);
  
  res.status(200).json({
    success: true,
    status: message
  });
});

module.exports = router;
