# SeaAir Mobile App API

Transport layer API for SeaAir mobile app and physical controller communication using Protocol Buffers.

## Overview

This Node.js API serves as a message transport layer between a mobile application and physical hardware controllers. The controllers communicate via WiFi while the mobile app can communicate either directly via Bluetooth or through this API when Bluetooth is unavailable.

## Features

- **In-memory message queues** with hashmap structure for fast access
- **Separate queues** for mobile app and controller messages
- **Message expiration** (11 minutes)
- **JWT authentication** for mobile app routes
- **Rate limiting** (25 requests per 30 seconds per controller/account)
- **Protobuf payload** support
- **Request logging** to console

## Installation

```bash
npm install
```

## Running the Server

```bash
npm start
```

The server runs on port 3000 by default. Use the `PORT` environment variable to change it:

```bash
PORT=8080 npm start
```

## API Endpoints

### Controller Routes (No Authentication Required)

#### POST /controller/heartbeat
Controller sends status updates (heartbeat).

**Request Body:**
```json
{
  "controllerId": "string (required)",
  "protobufPayload": "string (base64 encoded protobuf)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Heartbeat received",
  "controllerId": "string"
}
```

#### GET /controller/messages/:controllerId
Controller retrieves queued messages from mobile app.

**Response (when messages available):**
```json
{
  "success": true,
  "message": {
    "timestamp": "ISO 8601 timestamp",
    "sender": {
      "ip": "IP address",
      "type": "mobile",
      "authId": "Cognito auth ID"
    },
    "controllerId": "string",
    "protobufPayload": "base64 encoded protobuf"
  }
}
```

**Response (no messages):**
```json
{
  "success": false,
  "message": "No messages available"
}
```

### Mobile App Routes (JWT Authentication Required)

#### POST /mobile/message
Mobile app sends message to controller.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:**
```json
{
  "controllerId": "string (required)",
  "protobufPayload": "string (base64 encoded protobuf)"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message queued for controller",
  "controllerId": "string"
}
```

#### GET /mobile/status/:controllerId
Mobile app retrieves latest controller status.

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response (when status available):**
```json
{
  "success": true,
  "status": {
    "timestamp": "ISO 8601 timestamp",
    "sender": {
      "ip": "IP address",
      "type": "controller"
    },
    "controllerId": "string",
    "protobufPayload": "base64 encoded protobuf"
  }
}
```

### Utility Endpoints

#### GET /health
Health check endpoint with queue statistics.

**Response:**
```json
{
  "status": "healthy",
  "uptime": 12345.67,
  "timestamp": "ISO 8601 timestamp",
  "queues": {
    "mobileAppControllers": 5,
    "mobileAppMessages": 12,
    "controllerMessages": 5
  },
  "rateLimiter": {
    "trackedKeys": 10
  }
}
```

#### POST /test/generate-token
Generate JWT token for testing (development only).

**Request Body:**
```json
{
  "userId": "string"
}
```

**Response:**
```json
{
  "token": "JWT token string",
  "userId": "string",
  "message": "Token generated successfully (for testing only)"
}
```

## Message Queue Architecture

### Mobile App Queue
- Hashmap structure: `controllerId -> array of messages`
- Messages are processed in FIFO order
- Multiple messages can be queued per controller
- Messages expire after 11 minutes
- Messages are deleted after retrieval

### Controller Queue
- Hashmap structure: `controllerId -> single message`
- Only stores the latest heartbeat message
- Messages expire after 11 minutes
- Messages are deleted after retrieval

## Rate Limiting

The API implements rate limiting to prevent abuse:
- Maximum **25 requests per 30 seconds** per controller from the same account
- Maximum **25 requests per 30 seconds** per controller from the same IP address
- Requests exceeding the limit receive a `429 Too Many Requests` response

## JWT Authentication

Mobile app routes require JWT authentication via the `Authorization` header:

```
Authorization: Bearer <JWT_TOKEN>
```

The JWT token should contain:
- `sub` or `userId`: User identifier (Cognito auth ID)
- `iss`: Token issuer

In production, tokens should be issued by AWS Cognito. For testing, use the `/test/generate-token` endpoint.

## Environment Variables

- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: Secret key for JWT verification (default: 'your-secret-key-change-in-production')

## Message Format

All messages include:
- `timestamp`: ISO 8601 timestamp
- `sender`: Object with `ip`, `type`, and optionally `authId`
- `controllerId`: Unique controller identifier
- `protobufPayload`: Base64 encoded protobuf message

## Protobuf Definitions

The API uses Protocol Buffer definitions in:
- `ble.proto`: BLE communication messages
- `bossmarine.proto`: Boss Marine device definitions (HvacConfig, etc.)

## Logging

All API requests and payloads are logged to the console for debugging and monitoring purposes.

## Development Notes

- The message queue is in-memory and will be lost on server restart
- JWT secret should be set via environment variable in production
- The `/test/generate-token` endpoint should be disabled in production
