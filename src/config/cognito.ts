/**
 * AWS Configuration
 * Centralized configuration for AWS services (Cognito and DynamoDB)
 * 
 * Update these values once for your deployment
 */

export interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  region: string;
}

export interface AWSConfig {
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

/**
 * Default Cognito configuration
 * 
 * IMPORTANT: Update these values with your actual AWS Cognito configuration
 * You can set these values once here instead of using environment variables
 * 
 * To get these values:
 * 1. Go to AWS Console → Amazon Cognito → User Pools
 * 2. Select your User Pool
 * 3. Copy the Pool ID and Region
 * 4. Go to App Clients and copy the App client ID
 */
export const cognitoConfig: CognitoConfig = {
  // AWS Cognito User Pool ID (e.g., 'us-east-1_xxxxxxxxx')
  userPoolId: process.env.COGNITO_USER_POOL_ID || 'us-east-2_Z6wNcT7sN',
  
  // AWS Cognito App Client ID (e.g., '1234567890abcdefghijklmnop')
  clientId: process.env.COGNITO_CLIENT_ID || '40b923fpk6c5v1lvatbcqbdakq',
  
  // AWS Region where your Cognito User Pool is located (e.g., 'us-east-1', 'us-west-2')
  region: process.env.AWS_REGION || 'us-east-2',
};

/**
 * Default AWS configuration for DynamoDB and other AWS services
 * 
 * IMPORTANT: Set these values with your AWS credentials
 * You can set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables
 * or update the values here directly (not recommended for production)
 * 
 * For local development and testing:
 * - Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file
 * 
 * For production:
 * - Use IAM roles attached to your EC2/ECS/Lambda instances
 * - Or use environment variables in your deployment environment
 */
export const awsConfig: AWSConfig = {
  // AWS Region (should match your Cognito region)
  region: process.env.AWS_REGION || 'us-east-1',
  
  // AWS Access Key ID (optional - if not set, SDK will use IAM role or default credentials)
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  
  // AWS Secret Access Key (optional - if not set, SDK will use IAM role or default credentials)
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
};

/**
 * Check if Cognito is properly configured
 */
export function isCognitoConfigured(): boolean {
  return !!(cognitoConfig.userPoolId && cognitoConfig.clientId);
}

/**
 * Get Cognito configuration
 */
export function getCognitoConfig(): CognitoConfig {
  return cognitoConfig;
}

/**
 * Get AWS configuration
 */
export function getAWSConfig(): AWSConfig {
  return awsConfig;
}
