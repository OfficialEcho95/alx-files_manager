const RedisClient = require('../utils/redis');
const DBClient = require('../utils/db');

class AppController {
  static async getStatus(req, res) {
    const redisIsAlive = RedisClient.isAlive();
    const dbIsAlive = DBClient.isAlive();

    const status = {
      redis: redisIsAlive,
      db: dbIsAlive,
    };

    const statusCode = redisIsAlive && dbIsAlive ? 200 : 500;

    res.status(statusCode).json(status);
  }

  static async getStats(req, res) {
    const usersCount = await DBClient.nbUsers();
    const filesCount = await DBClient.nbFiles();

    const stats = {
      users: usersCount,
      files: filesCount,
    };

    res.status(200).json(stats);
  }

  
}

module.exports = AppController;
