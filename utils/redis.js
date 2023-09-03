const redis = require('redis');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.client.connected = true;

    // Handle Redis client errors
    this.client.on('error', (err) => {
      console.error(`${err}`);
    });
  }

  isAlive() {
    if (this.client.connected) {
      return true;
    }
    return false;
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
