// backend/src/server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import http from "http";
import config from "./config/config.js";
import { connectMongo, closeMongo } from "./api/db/mongo.js";
import router from "./api/routes/index.js";
import { emailServices, proposalServices, llmServices } from "./api/services/index.js";
import documentParser from "./api/services/document.parser.js";
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors());
app.use(bodyParser.json());

// mount all API routes under /api
app.use("/api", router);

// basic health endpoint
app.get("/health", (req, res) => res.json({ ok: true }));

const server = http.createServer(app);

const start = async () => {
  try {
    const uri = config.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set in config");

    await connectMongo(uri);

    // Start email monitoring for vendor proposals
    if (config.EMAIL_ID && config.EMAIL_PSSWD) {
      try {
        await emailServices.startEmailMonitoring(async (emailData) => {
          console.log(`Processing email: ${emailData.subject}`);

          // Check if this is a proposal response
          if (emailData.subject.toLowerCase().includes('rfp') ||
              emailData.subject.toLowerCase().includes('proposal') ||
              emailData.subject.toLowerCase().includes('quote') ||
              emailData.subject.toLowerCase().includes('quotation')) {

            let fullText = emailData.text || '';
            const savedAttachments = [];
            const uploadsDir = path.join(__dirname, 'uploads', 'proposals');

            // Process attachments if any
            if (emailData.attachmentsData && emailData.attachmentsData.length > 0) {
              console.log(`📎 Processing ${emailData.attachmentsData.length} attachments...`);

              for (const attachment of emailData.attachmentsData) {
                try {
                  // Parse document content
                  const parsedText = await documentParser.parseAttachment(
                    { filename: attachment.filename },
                    attachment.content
                  );

                  console.log(parsedText, "parsedText")

                  fullText += `\n\n--- Attachment: ${attachment.filename} ---\n${parsedText}`;

                  // Save attachment to disk
                  const savedFile = await documentParser.saveAttachment(
                    { filename: attachment.filename },
                    attachment.content,
                    uploadsDir
                  );

                  savedAttachments.push({
                    filename: attachment.filename,
                    savedPath: savedFile.filepath,
                    contentType: attachment.contentType,
                    size: attachment.size,
                  });

                  console.log(`✅ Parsed and saved: ${attachment.filename}`);
                } catch (err) {
                  console.error(`❌ Error processing attachment ${attachment.filename}:`, err);
                }
              }
            }

            // Extract RFP ID from subject line (format: "RFP #<id>: ..." or "Re: RFP #<id>: ...")
            let rfpId = null;
            const rfpIdMatch = emailData.subject.match(/RFP\s*#\s*([a-f0-9]{24})/i);
            if (rfpIdMatch) {
              rfpId = rfpIdMatch[1];
              console.log(`📋 Detected RFP ID: ${rfpId}`);
            } else {
              console.warn(`⚠️ Could not extract RFP ID from subject: "${emailData.subject}"`);
            }

            // Use LLM to extract structured proposal data
            console.log(`🤖 Extracting proposal data with AI...`);
            const extractedData = await llmServices.extractProposalFromText(fullText, emailData.subject);

            // Combine all data
            const proposalData = {
              ...extractedData,
              rfpId: rfpId,  // Store RFP ID for linking
              vendorEmail: emailData.from,
              raw_text: emailData.text,
              subject: emailData.subject,
              receivedAt: emailData.date,
              attachments: savedAttachments,
              fullParsedText: fullText,
            };

            // Save to proposals collection
            await proposalServices.create(proposalData);
            console.log(`✅ Saved proposal from ${extractedData.vendor_name} (${emailData.from})`);
          }
        });
      } catch (emailErr) {
        console.warn("Email monitoring failed to start:", emailErr.message);
        console.warn("Continuing without email monitoring...");
      }
    } else {
      console.warn("Email credentials not configured. Email monitoring disabled.");
    }

    const port = config.PORT || 4040;
    server.listen(port, () => {
      console.log(`App running on port ${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

start();

// Graceful shutdown
const shutdown = async (signal) => {
  try {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);

    // Stop email monitoring
    await emailServices.stopEmailMonitoring();

    server.close(() => {
      console.log("HTTP server closed.");
    });

    // close mongo connection if available
    await closeMongo();
    process.exit(0);
  } catch (e) {
    console.error("Error during shutdown", e);
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
