/**
 * AWS Cognito Configuration
 * Centralized configuration for AWS Cognito authentication
 * 
 * Update these values once for your deployment
 */

export interface CognitoConfig {
  userPoolId: string;
  clientId: string;
  region: string;
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
  region: process.env.AWS_REGION || 'us-east-1',
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
