/**
 * Controller Routes
 * Routes used by the physical controller device
 * No JWT authentication required
 */

const express = require('express');
const router = express.Router();

/**
 * POST /controller/heartbeat
 * Controller sends status updates (heartbeat)
 * Body: {
 *   controllerId: string (required),
 *   protobufPayload: string (base64 encoded protobuf)
 * }
 */
router.post('/heartbeat', (req, res) => {
  const { controllerId, protobufPayload } = req.body;
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`[Controller] Heartbeat received from controller ${controllerId} at ${ip}`);
  console.log(`[Controller] Payload:`, JSON.stringify(req.body, null, 2));

  // Validate required fields
  if (!controllerId) {
    console.log('[Controller] Error: controllerId is required');
    return res.status(400).json({ 
      error: 'controllerId is required' 
    });
  }

  if (!protobufPayload) {
    console.log('[Controller] Error: protobufPayload is required');
    return res.status(400).json({ 
      error: 'protobufPayload is required' 
    });
  }

  // Create message object
  const message = {
    timestamp: new Date().toISOString(),
    sender: {
      ip: ip,
      type: 'controller'
    },
    controllerId: controllerId,
    protobufPayload: protobufPayload
  };

  // Add to controller queue
  req.app.locals.messageQueue.addControllerMessage(controllerId, message);

  res.status(200).json({ 
    success: true,
    message: 'Heartbeat received',
    controllerId: controllerId
  });
});

/**
 * GET /controller/messages/:controllerId
 * Controller retrieves messages from mobile app
 * No authentication required
 */
router.get('/messages/:controllerId', (req, res) => {
  const { controllerId } = req.params;
  const ip = req.ip || req.connection.remoteAddress;

  console.log(`[Controller] Message retrieval request from ${ip} for controller ${controllerId}`);

  if (!controllerId) {
    return res.status(400).json({ 
      error: 'controllerId is required' 
    });
  }

  // Retrieve next message from queue
  const message = req.app.locals.messageQueue.getMobileAppMessage(controllerId);

  if (!message) {
    console.log(`[Controller] No messages available for controller ${controllerId}`);
    return res.status(404).json({ 
      success: false,
      message: 'No messages available'
    });
  }

  console.log(`[Controller] Returning message for controller ${controllerId}`);
  
  res.status(200).json({
    success: true,
    message: message
  });
});

module.exports = router;
