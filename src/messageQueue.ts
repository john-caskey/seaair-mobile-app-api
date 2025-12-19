/**
 * In-memory message queue implementation with hashmap structure
 * - Mobile app queue: Array of messages per controller (FIFO)
 * - Controller queue: Single latest message per controller
 * - Messages expire after 11 minutes
 */

import { Message, QueueStats } from './types';

export class MessageQueue {
  private mobileAppQueue: Map<string, Message[]>;
  private controllerQueue: Map<string, Message>;
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Hashmap for mobile app messages: controllerId -> array of messages
    this.mobileAppQueue = new Map<string, Message[]>();
    
    // Hashmap for controller messages: controllerId -> single message
    this.controllerQueue = new Map<string, Message>();
    
    // Start cleanup interval for expired messages
    this.cleanupInterval = this.startCleanup();
  }

  /**
   * Add a message from mobile app to a controller queue
   * @param controllerId - Unique controller identifier
   * @param message - Message object with timestamp, sender, auth, protobuf payload
   */
  addMobileAppMessage(controllerId: string, message: Message): void {
    const messageWithExpiry: Message = {
      ...message,
      expiresAt: Date.now() + (11 * 60 * 1000) // 11 minutes from now
    };

    if (!this.mobileAppQueue.has(controllerId)) {
      this.mobileAppQueue.set(controllerId, []);
    }
    
    const queue = this.mobileAppQueue.get(controllerId);
    if (queue) {
      queue.push(messageWithExpiry);
      console.log(`[MessageQueue] Added mobile app message for controller ${controllerId}. Queue size: ${queue.length}`);
    }
  }

  /**
   * Add or update controller heartbeat message
   * @param controllerId - Unique controller identifier
   * @param message - Message object with timestamp, sender, protobuf payload
   */
  addControllerMessage(controllerId: string, message: Message): void {
    const messageWithExpiry: Message = {
      ...message,
      expiresAt: Date.now() + (11 * 60 * 1000) // 11 minutes from now
    };

    // Only store the latest message
    this.controllerQueue.set(controllerId, messageWithExpiry);
    
    console.log(`[MessageQueue] Updated controller message for controller ${controllerId}`);
  }

  /**
   * Retrieve and delete next mobile app message for a controller
   * @param controllerId - Unique controller identifier
   * @returns Message or null if none available
   */
  getMobileAppMessage(controllerId: string): Message | null {
    const queue = this.mobileAppQueue.get(controllerId);
    
    if (!queue || queue.length === 0) {
      return null;
    }

    // Remove expired messages first
    this.cleanupExpiredMessages(controllerId, queue);

    if (queue.length === 0) {
      return null;
    }

    // Get first message (FIFO) and remove it
    const message = queue.shift();
    
    // Clean up empty arrays
    if (queue.length === 0) {
      this.mobileAppQueue.delete(controllerId);
    }

    console.log(`[MessageQueue] Retrieved and deleted mobile app message for controller ${controllerId}`);
    
    return message || null;
  }

  /**
   * Retrieve and delete controller heartbeat message
   * @param controllerId - Unique controller identifier
   * @returns Message or null if none available
   */
  getControllerMessage(controllerId: string): Message | null {
    const message = this.controllerQueue.get(controllerId);
    
    if (!message) {
      return null;
    }

    // Check if expired
    if (message.expiresAt && Date.now() > message.expiresAt) {
      this.controllerQueue.delete(controllerId);
      return null;
    }

    // Remove message after successful retrieval
    this.controllerQueue.delete(controllerId);
    
    console.log(`[MessageQueue] Retrieved and deleted controller message for controller ${controllerId}`);
    
    return message;
  }

  /**
   * Clean up expired messages from a specific mobile app queue
   */
  private cleanupExpiredMessages(controllerId: string, queue: Message[]): void {
    const now = Date.now();
    let removedCount = 0;

    // Remove expired messages from the beginning of the queue
    while (queue.length > 0 && queue[0].expiresAt && now > queue[0].expiresAt) {
      queue.shift();
      removedCount++;
    }

    if (removedCount > 0) {
      console.log(`[MessageQueue] Removed ${removedCount} expired messages for controller ${controllerId}`);
    }
  }

  /**
   * Start periodic cleanup of expired messages
   */
  private startCleanup(): NodeJS.Timeout {
    // Run cleanup every minute
    return setInterval(() => {
      this.cleanupAllExpiredMessages();
    }, 60 * 1000);
  }

  /**
   * Clean up all expired messages from all queues
   */
  private cleanupAllExpiredMessages(): void {
    const now = Date.now();
    let totalRemoved = 0;

    // Clean mobile app queues
    for (const [controllerId, queue] of this.mobileAppQueue.entries()) {
      const originalLength = queue.length;
      
      // Filter out expired messages
      const filteredQueue = queue.filter(msg => !msg.expiresAt || now <= msg.expiresAt);
      
      if (filteredQueue.length === 0) {
        this.mobileAppQueue.delete(controllerId);
      } else if (filteredQueue.length !== originalLength) {
        this.mobileAppQueue.set(controllerId, filteredQueue);
      }
      
      totalRemoved += (originalLength - filteredQueue.length);
    }

    // Clean controller queue
    for (const [controllerId, message] of this.controllerQueue.entries()) {
      if (message.expiresAt && now > message.expiresAt) {
        this.controllerQueue.delete(controllerId);
        totalRemoved++;
      }
    }

    if (totalRemoved > 0) {
      console.log(`[MessageQueue] Cleanup: Removed ${totalRemoved} expired messages`);
    }
  }

  /**
   * Get queue statistics for monitoring
   */
  getStats(): QueueStats {
    let mobileAppCount = 0;
    for (const queue of this.mobileAppQueue.values()) {
      mobileAppCount += queue.length;
    }

    return {
      mobileAppControllers: this.mobileAppQueue.size,
      mobileAppMessages: mobileAppCount,
      controllerMessages: this.controllerQueue.size
    };
  }

  /**
   * Stop the cleanup interval (useful for testing)
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}
