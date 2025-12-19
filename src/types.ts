/**
 * Shared type definitions for the SeaAir Mobile App API
 */

/**
 * Message sender information
 */
export interface MessageSender {
  ip: string;
  type: 'mobile' | 'controller';
  authId?: string;
}

/**
 * Message structure
 */
export interface Message {
  timestamp: string;
  sender: MessageSender;
  controllerId: string;
  protobufPayload: string;
  expiresAt?: number;
}

/**
 * Queue statistics
 */
export interface QueueStats {
  mobileAppControllers: number;
  mobileAppMessages: number;
  controllerMessages: number;
}

/**
 * Rate limiter statistics
 */
export interface RateLimiterStats {
  trackedKeys: number;
}

/**
 * Authenticated user information
 */
export interface AuthInfo {
  sub: string;
  username?: string;
  email?: string;
  [key: string]: any;
}

/**
 * Cognito configuration status
 */
export interface CognitoStatus {
  configured: boolean;
  userPoolId: string;
  region: string;
}

/**
 * Health check response
 */
export interface HealthResponse {
  status: string;
  uptime: number;
  timestamp: string;
  queues: QueueStats;
  rateLimiter: RateLimiterStats;
  cognito: CognitoStatus;
}
