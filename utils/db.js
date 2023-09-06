const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(url, { useUnifiedTopology: true });

    // Connect to MongoDB in the constructor
    this.connectToDB();
  }

  async connectToDB() {
    try {
      await this.client.connect();
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error(`MongoDB Connection Error: ${err}`);
    }
  }

  isAlive() {
    return !!this.client && this.client.isConnected();
  }

  async nbUsers() {
    if (!this.isAlive()) {
      console.error('Database connection is not alive.');
      return 0; // Handle gracefully if not connected
    }
    const usersCollection = await this.client.db().collection('users');
    return usersCollection.countDocuments();
  }

  async nbFiles() {
    if (!this.isAlive()) {
      console.error('Database connection is not alive.');
      return 0; // Handle gracefully if not connected
    }
    const filesCollection = await this.client.db().collection('files');
    return filesCollection.countDocuments();
  }

  filesCollection() {
    return this.db.collection('files');
  }

  findUserByEmail(email) {
    return this.db.collection('users').findOne({ email });
  }

  async addUser(email, password) {
    const hashedPassword = sha1(password);
    const result = await this.db.collection('users').insertOne(
      {
        email,
        password: hashedPassword,
      },
    );
    return {
      email: result.ops[0].email,
      id: result.ops[0]._id,
    };
  }

  async findUserById(userId) {
    if (!this.isAlive()) {
      console.error('Database connection is not alive.');
      return null; // Handle gracefully if not connected
    }

    const usersCollection = this.client.db().collection('users');
    try {
      const user = await usersCollection.findOne({ _id: ObjectId(userId) });
      return user;
    } catch (error) {
      console.error(`Error finding user by ID: ${error}`);
      return null;
    }
  }
}

const dbClient = new DBClient();

module.exports = dbClient;
