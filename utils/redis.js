const redis = require('redis');

/**
 * RedisClient class for managing a Redis client.
 */
class RedisClient {
  /**
   * Creates a new instance of the RedisClient class.
   */
  constructor() {
    // Initialize the Redis client.
    this.client = redis.createClient();
    this.client.connected = true;

    // Handle Redis client errors.
    this.client.on('error', (err) => {
      console.error(`${err}`);
    });
  }

  /**
   * Checks if the Redis client is alive (connected).
   * @returns {boolean} True if the client is connected, otherwise false.
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   * Retrieves the value associated with a given key from Redis.
   * @param {string} key - The key to retrieve the value for.
   * @returns {Promise<string|null>} A Promise that resolves
   * to the value or null if the key doesn't exist.
   */
  async get(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }

  /**
   * Sets a key-value pair in Redis with an expiration time.
   * @param {string} key - The key to set.
   * @param {string} value - The value to associate with the key.
   * @param {number} durationInSeconds - The expiration time in seconds.
   * @returns {Promise<string>} A Promise that resolves when the key-value pair is set.
   */
  async set(key, value, durationInSeconds) {
    return new Promise((resolve, reject) => {
      this.client.setex(key, durationInSeconds, value, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }

  /**
   * Deletes a key and its associated value from Redis.
   * @param {string} key - The key to delete.
   * @returns {Promise<number>} A Promise that resolves with the number of keys deleted (0 or 1).
   */
  async del(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, reply) => {
        if (err) {
          reject(err);
        } else {
          resolve(reply);
        }
      });
    });
  }
}

// Create an instance of the RedisClient class.
const redisClient = new RedisClient();

module.exports = redisClient;
