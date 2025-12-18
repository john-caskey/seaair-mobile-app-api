/**
 * In-memory message queue implementation with hashmap structure
 * - Mobile app queue: Array of messages per controller (FIFO)
 * - Controller queue: Single latest message per controller
 * - Messages expire after 11 minutes
 */

class MessageQueue {
  constructor() {
    // Hashmap for mobile app messages: controllerId -> array of messages
    this.mobileAppQueue = new Map();
    
    // Hashmap for controller messages: controllerId -> single message
    this.controllerQueue = new Map();
    
    // Start cleanup interval for expired messages
    this.startCleanup();
  }

  /**
   * Add a message from mobile app to a controller queue
   * @param {string} controllerId - Unique controller identifier
   * @param {object} message - Message object with timestamp, sender, auth, protobuf payload
   */
  addMobileAppMessage(controllerId, message) {
    const messageWithExpiry = {
      ...message,
      expiresAt: Date.now() + (11 * 60 * 1000) // 11 minutes from now
    };

    if (!this.mobileAppQueue.has(controllerId)) {
      this.mobileAppQueue.set(controllerId, []);
    }
    
    this.mobileAppQueue.get(controllerId).push(messageWithExpiry);
    
    console.log(`[MessageQueue] Added mobile app message for controller ${controllerId}. Queue size: ${this.mobileAppQueue.get(controllerId).length}`);
  }

  /**
   * Add or update controller heartbeat message
   * @param {string} controllerId - Unique controller identifier
   * @param {object} message - Message object with timestamp, sender, protobuf payload
   */
  addControllerMessage(controllerId, message) {
    const messageWithExpiry = {
      ...message,
      expiresAt: Date.now() + (11 * 60 * 1000) // 11 minutes from now
    };

    // Only store the latest message
    this.controllerQueue.set(controllerId, messageWithExpiry);
    
    console.log(`[MessageQueue] Updated controller message for controller ${controllerId}`);
  }

  /**
   * Retrieve and delete next mobile app message for a controller
   * @param {string} controllerId - Unique controller identifier
   * @returns {object|null} Message or null if none available
   */
  getMobileAppMessage(controllerId) {
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
    
    return message;
  }

  /**
   * Retrieve and delete controller heartbeat message
   * @param {string} controllerId - Unique controller identifier
   * @returns {object|null} Message or null if none available
   */
  getControllerMessage(controllerId) {
    const message = this.controllerQueue.get(controllerId);
    
    if (!message) {
      return null;
    }

    // Check if expired
    if (Date.now() > message.expiresAt) {
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
  cleanupExpiredMessages(controllerId, queue) {
    const now = Date.now();
    let removedCount = 0;

    // Remove expired messages from the beginning of the queue
    while (queue.length > 0 && now > queue[0].expiresAt) {
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
  startCleanup() {
    // Run cleanup every minute
    setInterval(() => {
      this.cleanupAllExpiredMessages();
    }, 60 * 1000);
  }

  /**
   * Clean up all expired messages from all queues
   */
  cleanupAllExpiredMessages() {
    const now = Date.now();
    let totalRemoved = 0;

    // Clean mobile app queues
    for (const [controllerId, queue] of this.mobileAppQueue.entries()) {
      const originalLength = queue.length;
      
      // Filter out expired messages
      const filteredQueue = queue.filter(msg => now <= msg.expiresAt);
      
      if (filteredQueue.length === 0) {
        this.mobileAppQueue.delete(controllerId);
      } else if (filteredQueue.length !== originalLength) {
        this.mobileAppQueue.set(controllerId, filteredQueue);
      }
      
      totalRemoved += (originalLength - filteredQueue.length);
    }

    // Clean controller queue
    for (const [controllerId, message] of this.controllerQueue.entries()) {
      if (now > message.expiresAt) {
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
  getStats() {
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
}

module.exports = MessageQueue;
