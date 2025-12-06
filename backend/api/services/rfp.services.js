// RfpService.js
import { db } from "../db/mongo.js";
import llmServices from "./llm.services.js";
import mongocollections from '../db/mongo.collections.js'

const COLLECTION = mongocollections.rfps;

class RfpService {

  createFromText = async(text) => {
    // Use LLM service to extract structured data from natural language
    const extracted = await llmServices.extractRFPFromText(text);

    const created = await db.insertOne(COLLECTION, {
      ...extracted,
      raw_text: text,
      status: "open",
    });
    return created;
  }

  list =async() =>{
    return db.findMany(COLLECTION, {}, { sort: { createdAt: -1 } });
  }

  getById = async(id) =>{
    try {
      const obj = await db.findOne(COLLECTION, { _id: new db.ObjectId(id) });
      return obj;
    } catch (e) {
      return null;
    }
  }

  updateById = async(id, updateData) => {
    try {
      await db.updateOne(
        COLLECTION,
        { _id: new db.ObjectId(id) },
        { $set: updateData }
      );
      return await this.getById(id);
    } catch (e) {
      throw new Error(`Failed to update RFP: ${e.message}`);
    }
  }

  delete = async(id)=> {
    return await db.deleteOne(COLLECTION, { _id: new db.ObjectId(id) });
  }
}

export default new RfpService()
