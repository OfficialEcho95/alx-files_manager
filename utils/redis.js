const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = redis.createClient({ host: 'localhost', port: 6379 });

    // Initialize a flag to track the connection status.
    this.connected = false;

    // Handle Redis client events.
    this.client.on('connect', () => {
      this.connected = true;
      console.log('Connected to Redis');
    });

    this.client.on('error', (err) => {
      console.error(`Redis Error: ${err}`);
    });

    this.client.on('end', () => {
      this.connected = false;
      console.log('Disconnected from Redis');
    });
  }

  // Updated isAlive() method that returns a Promise.
  async isAlive() {
    return new Promise((resolve) => {
      if (this.connected) {
        resolve(true);
      } else {
        // Listen for the 'connect' event and resolve when connected.
        this.client.once('connect', () => {
          resolve(true);
        });
      }
    });
  }


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

const redisClient = new RedisClient();

module.exports = redisClient;
