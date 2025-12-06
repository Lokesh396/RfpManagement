// backend/src/db/mongo.js
import { MongoClient, ObjectId } from "mongodb";

let client = null;
let _db = null;

export async function connectMongo(uri, dbName = "AERCHAIN") {
  if (_db) return _db;

  client = new MongoClient(uri);
  await client.connect();
  _db = client.db(dbName);

  console.log("✅ MongoDB connected");
  return _db;
}

export function getDb() {
  if (!_db) throw new Error("Mongo not initialized");
  return _db;
}

export function getCollection(name) {
  return getDb().collection(name);
}

export const db = {
  ObjectId,

  async insertOne(collection, doc) {
    const col = getCollection(collection);
    const now = new Date();
    const payload = { ...doc, createdAt: now, updatedAt: now };
    const result = await col.insertOne(payload);
    return { _id: result.insertedId, ...payload };
  },

  async findOne(collection, filter) {
    return getCollection(collection).findOne(filter);
  },

  async findMany(collection, filter = {}, options = {}) {
    const cursor = getCollection(collection).find(filter, options);
    if (options.sort) cursor.sort(options.sort);
    return cursor.toArray();
  },

  async updateOne(collection, filter, update) {
    update.$set = { ...(update.$set || {}), updatedAt: new Date() };
    return getCollection(collection).updateOne(filter, update);
  },

  async deleteOne(collection, filter) {
    return getCollection(collection).deleteOne(filter);
  },

 
};

export async function closeMongo(){
  return
}
