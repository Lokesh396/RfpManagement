// ProposalService.js
import { db } from "../db/mongo.js";
import mongocollections from "../db/mongo.collections.js"

const COLLECTION = mongocollections.proposals;

class ProposalService {
  constructor() {}

  // create proposal doc (parsed or raw)
  async create(proposalObj) {
    // proposalObj should include rfpId (optional), vendorId (optional), vendorName, raw_text, parsed
    return db.insertOne(COLLECTION, proposalObj);
  }

  // list proposals for an RFP
  async listByRfp(rfpId) {
    if (!rfpId) return [];
    return db.findMany(COLLECTION, { rfpId });
  }

  // generic list
  async list() {
    return db.findMany(COLLECTION, {}, { sort: { createdAt: -1 } });
  }

  async getById(id) {
    if (!id) return null;
    let objectId;
    try {
      objectId = new db.ObjectId(id);
    } catch (err) {
      throw new Error("Invalid proposal ID");
    }
    return db.findOne(COLLECTION, { _id: objectId });
  }

  // update proposal by id
  async updateById(id, updateData) {
    if (!id) throw new Error("Proposal ID is required");
    let objectId;
    try {
      objectId = new db.ObjectId(id);
    } catch (err) {
      throw new Error("Invalid proposal ID");
    }

    const filter = { _id: objectId };
    const result = await db.updateOne(COLLECTION, filter, { $set: updateData });
    if (!result?.matchedCount) {
      return null;
    }
    return db.findOne(COLLECTION, filter);
  }
}

export default new ProposalService()
