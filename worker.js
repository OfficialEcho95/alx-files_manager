var Queue = require('bull');
var fs = require('fs');
var generateThumbnail = require('image-thumbnail');
var dBClient = require('./utils/db');
var FilesCollection = require('./utils/file').FilesCollection;

var writeFile = fs.promises.writeFile;

var THUMBNAIL_SIZES = [500, 250, 100];

var fileQueue = new Queue('image-thumbnail-worker', {
  redis: {
    host: 'localhost',
    port: 6379,
  },
});

function createAndSaveThumbnail(path, width) {
  return generateThumbnail(path, { width: width, responseType: 'base64' })
    .then(function (thumbnail) {
      var filePath = path + '_' + width;
      return writeFile(filePath, Buffer.from(thumbnail, 'base64'));
    });
}

fileQueue.process(function (job, done) {
  var userId = job.data.userId;
  var fileId = job.data.fileId;
  if (!fileId) {
    done(new Error('Missing fileId'));
    return;
  }
  if (!userId) {
    done(new Error('Missing userId'));
    return;
  }

  var filesCollection = new FilesCollection();
  filesCollection.findUserFileById(userId, fileId, false)
    .then(function (file) {
      if (!file) {
        done(new Error('File not found'));
        return;
      }

      THUMBNAIL_SIZES.forEach(function (size) {
        createAndSaveThumbnail(file.localPath, size);
      });
      done();
    });
});

var userQueue = new Queue('user-welcome-worker', {
  redis: {
    host: 'localhost',
    port: 6379,
  },
});

userQueue.process(function (job, done) {
  var userId = job.data.userId;
  if (!userId) {
    done(new Error('Missing userId'));
    return;
  }

  dBClient.findUserById(userId)
    .then(function (user) {
      if (!user) {
        done(new Error('User not found'));
        return;
      }

      console.log('Welcome ' + user.email);
      done();
    });
});

module.exports = fileQueue;
