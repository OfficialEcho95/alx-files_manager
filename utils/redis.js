var redis = require('redis');
var util = require('util');

function RedisClient() {
  this.client = redis.createClient();
  this.isConnected = false;

  this.client.on('error', function(err) {
    console.log('Redis Client Error', err);
  });

  this.client.on('connect', function() {
    this.isConnected = true;
  }.bind(this));

  this.asyncSetX = util.promisify(this.client.setex).bind(this.client);
  this.asyncGet = util.promisify(this.client.get).bind(this.client);
  this.asyncDel = util.promisify(this.client.del).bind(this.client);
  this.asyncExpire = util.promisify(this.client.expire).bind(this.client);
}

RedisClient.prototype.isAlive = function() {
  return this.isConnected;
};

RedisClient.prototype.set = function(key, value, expiry) {
  this.asyncSetX(key, expiry, value);
};

RedisClient.prototype.get = function(key) {
  return this.asyncGet(key);
};

RedisClient.prototype.del = function(key) {
  return this.asyncDel(key);
};

var redisClient = new RedisClient();
module.exports = redisClient;
