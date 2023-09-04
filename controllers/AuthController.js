const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto'); // Import the 'crypto' module
const RedisClient = require('../utils/redis');
const DBClient = require('../utils/db');

function verifyPassword(hash, password) {
  const sha1 = crypto.createHash('sha1').update(password).digest('hex');
  return sha1 === hash;
}

class AuthController {
  static async getConnect(req, res) {
    // Implement the authentication logic here
    try {
      // Extract Basic Auth credentials from the Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized: Missing Authorization header' });
      }

      const authData = authHeader.split(' ')[1];
      if (!authData) {
        return res.status(401).json({ error: 'Unauthorized: Missing Basic Auth data' });
      }

      const [email, password] = Buffer.from(authData, 'base64').toString().split(':');

      // Check if the user exists in the database and verify their password
      const user = await DBClient.client
        .db()
        .collection('users')
        .findOne({ email });

      if (!user || !verifyPassword(user.password, password)) {
        return res.status(401).json({ error: 'Unauthorized: Invalid email or password' });
      }

      // Generate a random token and store it in Redis
      const token = uuidv4();
      await RedisClient.set(`auth_${token}`, user._id.toString(), 86400); // 86400 seconds (24 hours)

      // Respond with the token
      return res.status(200).json({ token });
    } catch (error) {
      console.error('Error during authentication:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getDisconnect(req, res) {
    // Implement the logout logic here
    try {
      // Retrieve the token from the X-Token header
      const token = req.headers['x-token'];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Missing X-Token header' });
      }

      // Delete the token from Redis
      await RedisClient.del(`auth_${token}`);

      // Respond with a successful logout status
      return res.status(204).send();
    } catch (error) {
      console.error('Error during logout:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = AuthController;
