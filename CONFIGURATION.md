# Configuration Guide

This guide explains how to configure the SeaAir Mobile App API for different environments.

## Environment Variables

The API can be configured using environment variables. Copy `.env.example` to `.env` and adjust the values:

```bash
cp .env.example .env
```

### Available Environment Variables

#### PORT
- **Description**: The port on which the API server will listen
- **Default**: `3000`
- **Example**: `PORT=8080`

#### JWT_SECRET
- **Description**: Secret key used to sign and verify JWT tokens
- **Default**: `your-secret-key-change-in-production`
- **Important**: In production, use a strong, randomly generated secret
- **Generate a secure secret**:
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
- **Example**: `JWT_SECRET=a1b2c3d4e5f6...`

## Production Deployment

### Security Considerations

1. **JWT Secret**: Always use a strong, randomly generated JWT secret in production
   ```bash
   JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
   ```

2. **HTTPS**: Deploy behind a reverse proxy (like Nginx) with SSL/TLS enabled

3. **Rate Limiting**: The built-in rate limiter provides basic protection, but consider adding additional protection at the infrastructure level (e.g., AWS WAF, Cloudflare)

4. **Token Generation**: Disable the `/test/generate-token` endpoint in production or protect it with additional authentication

5. **CORS**: Add appropriate CORS headers if the API needs to be accessed from web browsers

6. **Input Validation**: The API validates basic inputs, but ensure protobuf payloads are validated on the application layer

### Deployment Options

#### Option 1: Direct Node.js

```bash
# Set environment variables
export PORT=8080
export JWT_SECRET="your-production-secret"

# Start the server
npm start
```

#### Option 2: Using PM2 (Process Manager)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name seaair-api

# Make it restart on reboot
pm2 startup
pm2 save
```

#### Option 3: Docker

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t seaair-api .
docker run -p 3000:3000 \
  -e JWT_SECRET="your-secret" \
  seaair-api
```

#### Option 4: AWS Elastic Beanstalk

1. Install the EB CLI:
   ```bash
   pip install awsebcli
   ```

2. Initialize and deploy:
   ```bash
   eb init
   eb create seaair-api-prod
   eb setenv JWT_SECRET="your-secret"
   eb deploy
   ```

#### Option 5: Heroku

```bash
# Create app
heroku create seaair-api

# Set environment variables
heroku config:set JWT_SECRET="your-secret"

# Deploy
git push heroku main
```

## Integration with AWS Cognito

In production, JWT tokens should be issued by AWS Cognito instead of the test endpoint.

### Configuration

1. Create a Cognito User Pool in AWS
2. Update the JWT verification to accept Cognito tokens:

```javascript
// src/auth.js modifications
const jwksClient = require('jwks-rsa');

const client = jwksClient({
  jwksUri: `https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, function(err, key) {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

// Update verifyJWT to use Cognito's public key
```

3. Mobile app should authenticate with Cognito and use the returned token

## Monitoring and Logging

### Built-in Logging

The API logs all requests using Morgan:
- Request method, path, status code, response time
- Authentication attempts
- Rate limiting events
- Queue operations

### Health Checks

Monitor the `/health` endpoint:

```bash
curl http://localhost:3000/health
```

Use this endpoint for:
- Load balancer health checks
- Monitoring systems (Datadog, New Relic, etc.)
- Uptime monitoring

### Recommended Monitoring

1. **Application Performance Monitoring (APM)**
   - New Relic, Datadog, or Application Insights
   - Track response times, error rates, throughput

2. **Log Aggregation**
   - CloudWatch Logs (AWS)
   - Elasticsearch + Kibana
   - Splunk

3. **Metrics to Track**
   - Request rate per endpoint
   - Queue sizes (mobile app and controller queues)
   - Rate limiting events
   - Authentication failures
   - Message expiration rate
   - Response times

## Scaling Considerations

### Current Limitations

The current implementation uses in-memory storage:
- Messages are lost on server restart
- Cannot scale horizontally (multiple instances)
- Limited by single server memory

### Scaling Options

#### 1. Redis for Shared State

Replace in-memory queues with Redis:

```javascript
const redis = require('redis');
const client = redis.createClient();

// Store messages in Redis with TTL
await client.set(`mobile:${controllerId}`, JSON.stringify(messages), {
  EX: 11 * 60 // 11 minutes
});
```

#### 2. Message Queue (SQS, RabbitMQ)

Use a dedicated message queue service:
- AWS SQS for message storage
- Redis Pub/Sub for real-time notifications
- RabbitMQ for more complex routing

#### 3. Database Storage

For persistence and reliability:
- DynamoDB with TTL for automatic expiration
- MongoDB with TTL indexes
- PostgreSQL with background cleanup jobs

## Performance Tuning

### Node.js Settings

```bash
# Increase event loop capacity
NODE_OPTIONS="--max-old-space-size=4096"

# Enable clustering
npm install -g pm2
pm2 start server.js -i max
```

### Rate Limiting Adjustments

Modify `src/rateLimiter.js`:

```javascript
// Increase limit for specific users/controllers
if (isWhitelisted(key)) {
  return true; // Skip rate limiting
}
```

### Queue Size Limits

Add maximum queue size to prevent memory issues:

```javascript
// In messageQueue.js
const MAX_QUEUE_SIZE = 1000;

if (queue.length >= MAX_QUEUE_SIZE) {
  throw new Error('Queue is full');
}
```

## Testing in Different Environments

### Development

```bash
npm start
```

### Staging

```bash
PORT=8080 JWT_SECRET="staging-secret" npm start
```

### Production

```bash
PORT=80 JWT_SECRET="production-secret" NODE_ENV=production npm start
```

## Troubleshooting

### Issue: JWT tokens not working

**Solution**: Ensure JWT_SECRET matches between token generation and verification

### Issue: Rate limiting too aggressive

**Solution**: Adjust the limit in `src/rateLimiter.js` or increase the time window

### Issue: Messages expiring too quickly

**Solution**: Increase the expiration time in `src/messageQueue.js` (currently 11 minutes)

### Issue: High memory usage

**Solution**: 
- Implement maximum queue sizes
- Reduce message expiration time
- Move to external storage (Redis, database)

### Issue: Server crashes under load

**Solution**:
- Use PM2 for automatic restarts
- Implement proper error handling
- Add circuit breakers for downstream services
