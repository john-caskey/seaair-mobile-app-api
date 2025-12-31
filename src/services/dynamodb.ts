/**
 * DynamoDB Service
 * Service for interacting with AWS DynamoDB
 * Manages user-device associations
 */

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { getAWSConfig } from '../config/cognito';

// DynamoDB table name
const TABLE_NAME = 'seaair-user-device';

// Initialize DynamoDB client
let dynamoDBClient: DynamoDBDocumentClient | null = null;

/**
 * Get or create DynamoDB client
 */
function getDynamoDBClient(): DynamoDBDocumentClient {
  if (!dynamoDBClient) {
    const awsConfig = getAWSConfig();
    
    // Check if credentials are provided
    const hasCredentials = !!(awsConfig.accessKeyId && awsConfig.secretAccessKey);
    
    if (hasCredentials) {
      console.log(`[DynamoDB] Initializing client with provided credentials for region: ${awsConfig.region}`);
    } else {
      console.log(`[DynamoDB] Initializing client using default credential provider (IAM role) for region: ${awsConfig.region}`);
    }
    
    // Create base DynamoDB client
    const baseClient = new DynamoDBClient({
      region: awsConfig.region,
      ...(hasCredentials && {
        credentials: {
          accessKeyId: awsConfig.accessKeyId!,
          secretAccessKey: awsConfig.secretAccessKey!,
        },
      }),
    });

    // Create document client (simplifies working with DynamoDB)
    dynamoDBClient = DynamoDBDocumentClient.from(baseClient);
  }
  
  return dynamoDBClient;
}

/**
 * User-Device association interface
 */
export interface UserDeviceAssociation {
  userId: string;
  controllerId: number; // Non-negative integer within JavaScript safe integer range (0 to 2^53-1)
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Store user-device association in DynamoDB
 * @param userId - The user ID (Cognito sub)
 * @param controllerId - The controller device ID (numeric)
 * @returns Promise<void>
 */
export async function storeUserDeviceAssociation(
  userId: string,
  controllerId: number
): Promise<void> {
  const client = getDynamoDBClient();
  const timestamp = new Date().toISOString();

  const command = new PutCommand({
    TableName: TABLE_NAME,
    Item: {
      'user-id': userId,
      'controller-id': controllerId.toString(),
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  });

  try {
    await client.send(command);
    console.log(`[DynamoDB] Stored association: user=${userId}, controller=${controllerId}`);
  } catch (error: any) {
    console.error(`[DynamoDB] Error storing association: ${error.name || 'Unknown error'}`);
    throw new Error(`Failed to store user-device association: ${error.message}`);
  }
}

/**
 * Get user-device association from DynamoDB
 * @param userId - The user ID (Cognito sub)
 * @param controllerId - The controller device ID (numeric)
 * @returns Promise<UserDeviceAssociation | null>
 */
export async function getUserDeviceAssociation(
  userId: string,
  controllerId: number
): Promise<UserDeviceAssociation | null> {
  const client = getDynamoDBClient();

  const command = new GetCommand({
    TableName: TABLE_NAME,
    Key: {
      'user-id': userId,
      'controller-id': controllerId.toString(),
    },
  });

  try {
    const result = await client.send(command);
    
    if (!result.Item) {
      console.log(`[DynamoDB] No association found: user=${userId}, controller=${controllerId}`);
      return null;
    }

    const association: UserDeviceAssociation = {
      userId: result.Item['user-id'],
      controllerId: parseInt(result.Item['controller-id'], 10),
      createdAt: result.Item.createdAt,
      updatedAt: result.Item.updatedAt,
    };

    console.log(`[DynamoDB] Retrieved association: user=${userId}, controller=${controllerId}`);
    return association;
  } catch (error: any) {
    console.error(`[DynamoDB] Error retrieving association: ${error.name || 'Unknown error'}`);
    throw new Error(`Failed to retrieve user-device association: ${error.message}`);
  }
}

/**
 * Delete user-device association from DynamoDB
 * @param userId - The user ID (Cognito sub)
 * @param controllerId - The controller device ID (numeric)
 * @returns Promise<void>
 */
export async function deleteUserDeviceAssociation(
  userId: string,
  controllerId: number
): Promise<void> {
  const client = getDynamoDBClient();

  const command = new DeleteCommand({
    TableName: TABLE_NAME,
    Key: {
      'user-id': userId,
      'controller-id': controllerId.toString(),
    },
  });

  try {
    await client.send(command);
    console.log(`[DynamoDB] Deleted association: user=${userId}, controller=${controllerId}`);
  } catch (error: any) {
    console.error(`[DynamoDB] Error deleting association: ${error.name || 'Unknown error'}`);
    throw new Error(`Failed to delete user-device association: ${error.message}`);
  }
}
