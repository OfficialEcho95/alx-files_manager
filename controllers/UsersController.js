const crypto = require('crypto');
const DBClient = require('../utils/db');
const RedisClient = require('../utils/redis');

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      // Check if the email already exists in the database
      const existingUser = await DBClient.client
        .db()
        .collection('users')
        .findOne({ email });

      if (existingUser) {
        return res.status(400).json({ error: 'Already exists' });
      }

      // Hash the password using SHA1
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      // Create a new user document
      const newUser = {
        email,
        password: hashedPassword,
      };

      // Inserting the new user into the "users" collection
      const result = await DBClient.client
        .db()
        .collection('users')
        .insertOne(newUser);

      // Returning the new user with only the email and id
      const { _id } = result.ops[0];
      const responseUser = { email, id: _id };

      return res.status(201).json(responseUser);
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMe(req, res) {
    try {
      const token = req.headers['x-token'];
      if (!token) {
        return res.status(401).json({ error: 'Unauthorized: Missing X-Token header' });
      }

      // Retrieve the user ID from Redis using the token
      const userId = await RedisClient.get(`auth_${token}`);

      // If the token is not found in Redis, the user is not authenticated
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
      }

      // Retrieve the user details from the database using the user ID
      const user = await DBClient.client
        .db()
        .collection('users')
        .findOne({ _id: userId });

      // If the user is not found in the database, return an error
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Respond with the user object (email and id only)
      return res.status(200).json({ email: user.email, id: user._id });
    } catch (error) {
      console.error('Error during user retrieval:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = UsersController;
