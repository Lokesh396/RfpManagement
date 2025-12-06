// RfpController.js
import { rfpServices, emailServices, proposalServices, llmServices } from "../services/index.js";

class RfpController {

  create = async(req, res) => {
    try {
      const { text } = req.body;
      if (!text || typeof text !== "string") {
        return res.status(400).json({ error: "Field 'text' is required." });
      }
      const created = await rfpServices.createFromText(text);
      return res.status(201).json({ data: created });
    } catch (err) {
      console.error("RfpController.create", err);
      return res.status(500).json({ error: err.message || "Failed to create RFP" });
    }
  }

  list = async(req, res)=> {
    try {
      const data = await rfpServices.list();
      return res.json({ data });
    } catch (err) {
      console.error("RfpController.list", err);
      return res.status(500).json({ error: err.message || "Failed to list RFPs" });
    }
  }

  get = async(req, res)=> {
    try {
      const { id } = req.params;
      const rfp = await rfpServices.getById(id);
      if (!rfp) return res.status(404).json({ error: "RFP not found" });
      return res.json({ data: rfp });
    } catch (err) {
      console.error("RfpController.get", err);
      return res.status(500).json({ error: err.message || "Failed to fetch RFP" });
    }
  }

  remove = async(req, res)=> {
    try {
      const { id } = req.params;
      await rfpServices.delete(id);
      return res.json({ ok: true });
    } catch (err) {
      console.error("RfpController.remove", err);
      return res.status(500).json({ error: err.message || "Failed to delete RFP" });
    }
  }

  send = async(req, res) =>{
    try {
      const { id } = req.params;
      const { vendorEmails = [], body } = req.body;

      const rfp = await rfpServices.getById(id);
      if (!rfp) return res.status(404).json({ error: "RFP not found" });

      let emails = Array.isArray(vendorEmails) ? [...vendorEmails] : [];

      

      emails = Array.from(new Set(emails.map((e) => (e || "").trim()))).filter(Boolean);

      if (!emails.length) return res.status(400).json({ error: "No vendor emails provided" });

      const subjectFinal = `RFP #${id}: ${rfp.title || "Request for Proposal"}`;
      const bodyFinal = body || `Please find the RFP details below.`;

      // Send email using email service
      await emailServices.sendRfpEmail({
        toEmails: emails,
        subject: subjectFinal,
        body: bodyFinal,
        rfpData: rfp
      });

      return res.json({ ok: true, sentTo: emails });
    } catch (err) {
      console.error("RfpController.send", err);
      return res.status(500).json({ error: err.message || "Failed to send RFP" });
    }
  }

  // Get RFP with proposals
  getWithProposals = async(req, res) => {
    try {
      const { id } = req.params;
      const rfp = await rfpServices.getById(id);
      if (!rfp) return res.status(404).json({ error: "RFP not found" });

      const proposals = await proposalServices.listByRfp(id);

      return res.json({
        data: {
          rfp,
          proposals
        }
      });
    } catch (err) {
      console.error("RfpController.getWithProposals", err);
      return res.status(500).json({ error: err.message || "Failed to fetch RFP with proposals" });
    }
  }

  // Analyze proposals with AI
  analyzeProposals = async(req, res) => {
    try {
      const { id } = req.params;
      const rfp = await rfpServices.getById(id);
      if (!rfp) return res.status(404).json({ error: "RFP not found" });

      const proposals = await proposalServices.listByRfp(id);

      if (!proposals || proposals.length === 0) {
        return res.status(400).json({ error: "No proposals found for this RFP" });
      }

      const analysis = await llmServices.analyzeProposals(rfp, proposals);

      return res.json({
        data: analysis
      });
    } catch (err) {
      console.error("RfpController.analyzeProposals", err);
      return res.status(500).json({ error: err.message || "Failed to analyze proposals" });
    }
  }

  // Close deal - select winning proposal
  closeDeal = async(req, res) => {
    try {
      const { id } = req.params;
      const { proposalId, notes } = req.body;

      if (!proposalId) {
        return res.status(400).json({ error: "proposalId is required" });
      }

      const rfp = await rfpServices.getById(id);
      if (!rfp) return res.status(404).json({ error: "RFP not found" });

      let proposal;
      try {
        proposal = await proposalServices.getById(proposalId);
      } catch (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!proposal) {
        return res.status(404).json({ error: "Proposal not found" });
      }

      if (proposal.rfpId && proposal.rfpId.toString() !== id.toString()) {
        return res.status(400).json({ error: "Proposal does not belong to this RFP" });
      }

      await proposalServices.updateById(proposalId, {
        accepted: true,
        acceptedAt: new Date()
      });

      // Update RFP status to closed with selected proposal
      const updated = await rfpServices.updateById(id, {
        status: "closed",
        selectedProposalId: proposalId,
        closedAt: new Date(),
        closureNotes: notes || ""
      });

      return res.json({
        data: updated,
        message: "Deal closed successfully"
      });
    } catch (err) {
      console.error("RfpController.closeDeal", err);
      return res.status(500).json({ error: err.message || "Failed to close deal" });
    }
  }
}

export default new RfpController()
