var fs = require('fs');
var path = require('path');
var uuidv4 = require('uuid').v4;
var ObjectId = require('mongodb').ObjectId;
var dBClient = require('./db');

var FOLDER = 'folder';
var FILE = 'file';
var IMAGE = 'image';
var VALID_FILE_TYPES = [FOLDER, FILE, IMAGE];
var FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';
var MAX_PAGE_SIZE = 20;

var mkdir = fs.promises.mkdir;
var writeFile = fs.promises.writeFile;

function FilesCollection() {
  this.files = new dBClient.filesCollection();
}

FilesCollection.prototype.findById = function (id) {
  return this.files.findOne({ _id: ObjectId(id) });
};

FilesCollection.prototype.addFile = async function (file) {
  var result = await this.files.insertOne(file);
  var _id = result.ops[0]._id;
  delete result.ops[0]._id;
  return Object.assign({ id: _id }, result.ops[0]);
};

FilesCollection.prototype.findUserFileById = async function (userId, fileId, removeLocalPath) {
  if (!ObjectId.isValid(fileId)) {
    return null;
  }
  var result = await this.files.findOne({
    userId: ObjectId(userId),
    _id: ObjectId(fileId),
  });
  if (!result) {
    return null;
  }
  if (removeLocalPath) {
    return removeLocalPathProperty(replaceDefaultMongoId(result));
  }
  return replaceDefaultMongoId(result);
};

FilesCollection.prototype.findPublicOrOwnFile = async function (userId, fileId) {
  if (!ObjectId.isValid(fileId)) {
    return null;
  }
  var result = await this.files.findOne({
    _id: ObjectId(fileId),
  });
  if (!result) {
    return null;
  }
  if (!result.isPublic && (!userId || !result.userId.equals(userId))) {
    return null;
  }
  if (result.type !== FOLDER && !fs.existsSync(result.localPath)) {
    return null;
  }
  return replaceDefaultMongoId(result);
};

FilesCollection.prototype.findAllUserFilesByParentId = async function (userId, parentId, page) {
  var query = { userId: ObjectId(userId) };
  if (parentId !== 0) {
    if (!ObjectId.isValid(parentId)) {
      return [];
    }
    var parent = await this.findById(parentId);
    if (!parent || parent.type !== FOLDER) {
      return [];
    }
    query.parentId = ObjectId(parentId);
  }
  var results = await this.files
    .find(query)
    .skip(page * MAX_PAGE_SIZE)
    .limit(MAX_PAGE_SIZE)
    .toArray();
  return results.map(replaceDefaultMongoId).map(removeLocalPathProperty);
};

FilesCollection.prototype.updateFilePublication = async function (userId, fileId, isPublished) {
  if (!ObjectId.isValid(fileId)) {
    return null;
  }
  var result = await this.files.updateOne(
    {
      _id: ObjectId(fileId),
      userId: ObjectId(userId),
    },
    { $set: { isPublic: isPublished } }
  );
  if (result.matchedCount !== 1) {
    return null;
  }
  var doc = await this.findById(fileId);
  return removeLocalPathProperty(replaceDefaultMongoId(doc));
};

function replaceDefaultMongoId(document) {
  var _id = document._id;
  delete document._id;
  return Object.assign({ id: _id }, document);
}

function removeLocalPathProperty(document) {
  var doc = Object.assign({}, document);
  delete doc.localPath;
  return doc;
}

function File(userId, name, type, parentId, isPublic, data) {
  this.userId = userId;
  this.name = name;
  this.type = type;
  this.parentId = parentId || 0;
  this.isPublic = isPublic || false;
  this.data = data;
  this.filesCollection = new FilesCollection();
}

File.prototype.validate = async function () {
  if (!this.name) {
    return 'Missing name';
  }
  if (!this.type || !VALID_FILE_TYPES.includes(this.type)) {
    return 'Missing type';
  }
  if (!this.data && this.type !== FOLDER) {
    return 'Missing data';
  }
  if (this.parentId) {
    var parent = await this.filesCollection.findById(this.parentId);
    if (!parent) {
      return 'Parent not found';
    }
    if (parent.type !== FOLDER) {
      return 'Parent is not a folder';
    }
  }
  return null;
};

File.prototype.save = async function () {
  var error = await this.validate();
  if (error) {
    throw new Error(error);
  }
  if (this.type === FOLDER) {
    return this.filesCollection.addFile({
      userId: ObjectId(this.userId),
      name: this.name,
      type: FOLDER,
      parentId: this.parentId,
    });
  }
  await mkdir(FOLDER_PATH, { recursive: true });
  var localPath = path.join(FOLDER_PATH, uuidv4());
  await writeFile(localPath, Buffer.from(this.data, 'base64'));
  return this.filesCollection.addFile({
    userId: ObjectId(this.userId),
    name: this.name,
    type: this.type,
    isPublic: this.isPublic,
    parentId: this.parentId ? ObjectId(this.parentId) : 0,
    localPath: localPath,
  });
};

module.exports = {
  FOLDER: FOLDER,
  FilesCollection: FilesCollection,
  File: File,
};
