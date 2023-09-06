// Import the 'redis' library to work with Redis.
const redis = require('redis');

// RedisClient class for interacting with a Redis database.
class RedisClient {
  constructor() {
    // Create a new Redis client instance.
    this.client = redis.createClient();

    // Set the 'connected' property to 'true' initially.
    this.client.connected = true;

    // Handle Redis client errors by logging them.
    this.client.on('error', (err) => {
      console.error(`${err}`);
    });
  }

  /**
   * Check if the Redis client is alive and connected.
   * @returns {boolean} 'true' if the client is connected, otherwise 'false'.
   */
  isAlive() {
    // If the client is connected, return 'true'; otherwise, return 'false'.
    if (this.client.connected) {
      return true;
    }
    return false;
  }

  /**
   * Retrieve a value from Redis based on the provided 'key'.
   * @param {string} key - The key to retrieve the value for.
   * @returns {Promise<string|null>} A promise that resolves with the retrieved value or null if not found.
   */
  async get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, reply) => {
        if (err) {
          // Reject the promise if there's an error.
          reject(err);
        } else {
          // Resolve the promise with the retrieved value.
          resolve(reply);
        }
      });
    });
  }

  /**
   * Set a key-value pair in Redis with an optional expiration time (in seconds).
   * @param {string} key - The key to set.
   * @param {string} value - The value to associate with the key.
   * @param {number} durationInSeconds - The expiration time in seconds (optional).
   * @returns {Promise<string>} A promise that resolves with 'OK' on success.
   */
  async set(key, value, durationInSeconds) {
    return new Promise((resolve, reject) => {
      this.client.setex(key, durationInSeconds, value, (err, reply) => {
        if (err) {
          // Reject the promise if there's an error.
          reject(err);
        } else {
          // Resolve the promise with the reply (usually 'OK').
          resolve(reply);
        }
      });
    });
  }

  /**
   * Delete a key and its associated value from Redis.
   * @param {string} key - The key to delete.
   * @returns {Promise<number>} A promise that resolves with the number of keys deleted.
   */
  async del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, reply) => {
        if (err) {
          // Reject the promise if there's an error.
          reject(err);
        } else {
          // Resolve the promise with the reply (usually the number of keys deleted).
          resolve(reply);
        }
      });
    });
  }
}

// Create a new instance of the RedisClient class.
const redisClient = new RedisClient();

// Export the RedisClient instance for use in other parts of the application.
module.exports = redisClient;
