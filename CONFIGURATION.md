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

#### COGNITO_USER_POOL_ID
- **Description**: AWS Cognito User Pool ID for JWT authentication
- **Required**: Yes (for mobile app authentication to work)
- **Format**: `<region>_<random_string>` (e.g., `us-east-1_aBcDeFgHi`)
- **How to get**: From AWS Console → Cognito → User Pools → Your Pool → General Settings → Pool Id
- **Example**: `COGNITO_USER_POOL_ID=us-east-1_aBcDeFgHi`

#### COGNITO_CLIENT_ID
- **Description**: AWS Cognito App Client ID for your mobile application
- **Required**: Yes (for mobile app authentication to work)
- **Format**: 26-character alphanumeric string
- **How to get**: From AWS Console → Cognito → User Pools → Your Pool → App Clients → Your App → App client id
- **Example**: `COGNITO_CLIENT_ID=1234567890abcdefghijklmnop`

#### AWS_REGION
- **Description**: AWS region where your Cognito User Pool is located
- **Default**: `us-east-1`
- **Example**: `AWS_REGION=us-west-2`

#### AWS_ACCESS_KEY_ID
- **Description**: AWS Access Key ID for DynamoDB access
- **Required**: Optional (recommended to use IAM roles in production)
- **Format**: 20-character alphanumeric string
- **How to get**: From AWS Console → IAM → Users → Your User → Security Credentials → Access Keys
- **Example**: `AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE`
- **Note**: For production, use IAM roles attached to EC2/ECS/Lambda instead of hardcoding credentials

#### AWS_SECRET_ACCESS_KEY
- **Description**: AWS Secret Access Key for DynamoDB access
- **Required**: Optional (recommended to use IAM roles in production)
- **Format**: 40-character alphanumeric string
- **How to get**: From AWS Console → IAM → Users → Your User → Security Credentials → Access Keys
- **Example**: `AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY`
- **Note**: For production, use IAM roles attached to EC2/ECS/Lambda instead of hardcoding credentials

## AWS Cognito Setup

### Step 1: Create a Cognito User Pool

1. Go to AWS Console → Amazon Cognito
2. Click "Create user pool"
3. Configure sign-in options (email, username, etc.)
4. Configure security requirements (MFA, password policy)
5. Configure sign-up experience
6. Configure message delivery (email/SMS)
7. Name your user pool and create it

### Step 2: Create an App Client

1. In your User Pool, go to "App clients"
2. Click "Create app client"
3. Name your app client (e.g., "seaair-mobile-app")
4. Configure the following settings:
   - **Authentication flows**: Enable "ALLOW_USER_PASSWORD_AUTH" and "ALLOW_REFRESH_TOKEN_AUTH"
   - **Token expiration**: Set appropriate expiration times (default: 1 hour for access tokens)
5. Create the app client
6. Note the **App client ID** - you'll need this for `COGNITO_CLIENT_ID`

## AWS DynamoDB Setup

### Step 1: Create a DynamoDB Table

1. Go to AWS Console → DynamoDB
2. Click "Create table"
3. Configure table settings:
   - **Table name**: `seaair-user-device`
   - **Partition key**: `user-id` (String)
   - **Sort key**: `controller-id` (String)
4. Leave other settings as default or customize as needed
5. Click "Create table"

### Step 2: Configure IAM Permissions

#### For Local Development:

Create an IAM user with DynamoDB access:

1. Go to AWS Console → IAM → Users
2. Create a new user (e.g., "seaair-api-dev")
3. Attach the following policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:DeleteItem",
        "dynamodb:Query"
      ],
      "Resource": "arn:aws:dynamodb:*:*:table/seaair-user-device"
    }
  ]
}
```

4. Create access keys and note the Access Key ID and Secret Access Key
5. Add them to your `.env` file

#### For Production (Recommended):

Use IAM roles attached to your compute resources (EC2, ECS, Lambda):

1. Go to AWS Console → IAM → Roles
2. Create a new role for your service (e.g., EC2 role)
3. Attach the same DynamoDB policy shown above
4. Attach the role to your EC2 instance or ECS task
5. **Do not** set `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` - the SDK will automatically use the IAM role

### Step 3: Configure Your API

Set the environment variables:

```bash
export COGNITO_USER_POOL_ID="us-east-1_xxxxxxxxx"
export COGNITO_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxx"
export AWS_REGION="us-east-1"
# For local development only:
export AWS_ACCESS_KEY_ID="AKIAIOSFODNN7EXAMPLE"
export AWS_SECRET_ACCESS_KEY="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
export PORT=3000
```

Or create a `.env` file:

```
COGNITO_USER_POOL_ID=us-east-1_xxxxxxxxx
COGNITO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
# For local development only:
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
PORT=3000
```

### Step 4: Mobile App Integration

Your mobile app needs to:

1. **Install AWS SDK**:
   ```bash
   # For React Native
   npm install aws-amplify amazon-cognito-identity-js
   
   # For iOS
   pod 'AWSCognito'
   
   # For Android
   implementation 'com.amazonaws:aws-android-sdk-cognitoidentityprovider'
   ```

2. **Configure Cognito**:
   ```javascript
   // Example for React Native with AWS Amplify
   import { Amplify, Auth } from 'aws-amplify';
   
   Amplify.configure({
     Auth: {
       region: 'us-east-1',
       userPoolId: 'us-east-1_xxxxxxxxx',
       userPoolWebClientId: 'xxxxxxxxxxxxxxxxxxxxxxxxxx',
     }
   });
   ```

3. **Authenticate Users**:
   ```javascript
   // Sign in
   const user = await Auth.signIn(username, password);
   
   // Get access token
   const session = await Auth.currentSession();
   const accessToken = session.getAccessToken().getJwtToken();
   
   // Use token in API requests
   fetch('https://api.example.com/mobile/message', {
     method: 'POST',
     headers: {
       'Authorization': `Bearer ${accessToken}`,
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({...})
   });
   ```

4. **Handle Token Refresh**:
   ```javascript
   // AWS Amplify handles refresh automatically
   // Manually refresh if needed:
   const session = await Auth.currentSession();
   // This will automatically refresh if expired
   ```

## Production Deployment

### Security Considerations

1. **AWS Cognito**: Properly configure your Cognito User Pool with MFA, password policies, and security settings

2. **HTTPS**: Deploy behind a reverse proxy (like Nginx) with SSL/TLS enabled

3. **Rate Limiting**: The built-in rate limiter provides basic protection, but consider adding additional protection at the infrastructure level (e.g., AWS WAF, Cloudflare)

4. **CORS**: Add appropriate CORS headers if the API needs to be accessed from web browsers

5. **Input Validation**: The API validates basic inputs, but ensure protobuf payloads are validated on the application layer

### Deployment Options

#### Option 1: Direct Node.js

```bash
# Set environment variables
export PORT=8080
export COGNITO_USER_POOL_ID="us-east-1_xxxxxxxxx"
export COGNITO_CLIENT_ID="xxxxxxxxxxxxxxxxxxxxxxxxxx"
export AWS_REGION="us-east-1"

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
