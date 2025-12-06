import Router from "express";
import { RfpController } from "../controllers/index.js";

const router = Router();

// Create RFP from natural language
router.post("/", RfpController.create);

// List all RFPs
router.get("/", RfpController.list);

// Get single RFP by ID
router.get("/:id", RfpController.get);

// Get RFP with all proposals
router.get("/:id/proposals", RfpController.getWithProposals);

// Analyze proposals with AI
router.get("/:id/analyze", RfpController.analyzeProposals);

// Close deal - select winning proposal
router.post("/:id/close", RfpController.closeDeal);

// Send RFP to vendors
router.post("/:id/send", RfpController.send);

// Delete RFP
router.delete("/:id", RfpController.remove);

export default router;
