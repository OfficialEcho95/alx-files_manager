var sha1 = require('sha1');
var uuidv4 = require('uuid').v4;
var dBClient = require('./db');
var redisClient = require('./redis');

class AuthController {
  static getBasicAuthToken(request) {
    var authHeader = request.headers.authorization;
    if (!authHeader) { return null; }
    var token = authHeader.split(' ')[1];
    if (!token) { return null; }
    var decodedToken = Buffer.from(token, 'base64').toString('utf-8');
    var emailPassword = decodedToken.split(':');
    return { email: emailPassword[0], password: emailPassword[1] };
  }

  static getSessionToken(request) {
    var xHeader = request.headers['x-token'];
    if (!xHeader) { return null; }
    return xHeader;
  }

  static authenticateUser(email, password) {
    return dBClient.findUserByEmail(email)
      .then(function(user) {
        if (!user) { return null; }
        var hashedPassword = sha1(password);
        if (user.password !== hashedPassword) { return null; }
        return user;
      });
  }

  static generateSessionToken(userId) {
    var token = uuidv4();
    var key = 'auth_' + token;
    return redisClient.set(key, userId, 24 * 60 * 60)
      .then(function() {
        return { token: token };
      });
  }

  static deleteSessionToken(token) {
    return redisClient.get('auth_' + token)
      .then(function(userId) {
        if (!userId) { return false; }
        return redisClient.del('auth_' + token)
          .then(function() {
            return true;
          });
      });
  }

  static getUserFromSession(token) {
    return redisClient.get('auth_' + token)
      .then(function(userId) {
        if (!userId) { return null; }
        return dBClient.findUserById(userId)
          .then(function(user) {
            if (!user) { return null; }
            return { email: user.email, id: user._id };
          });
      });
  }

  static getCurrentUser(request) {
    var token = AuthController.getSessionToken(request);
    if (!token) { return null; }
    return AuthController.getUserFromSession(token)
      .then(function(user) {
        if (!user) { return null; }
        return user;
      });
  }
}

module.exports = AuthController;
