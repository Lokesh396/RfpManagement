import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import config from "../../config/config.js";
import { simpleParser } from "mailparser";

class EmailService {
  constructor() {
    // SMTP transporter for sending emails
    this.transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: config.EMAIL_ID,
        pass: config.EMAIL_PSSWD,
      },
    });

    // IMAP client for reading emails
    this.imapClient = null;
    this.isMonitoring = false;
    this.emailCallback = null;
    this.processedUIDs = new Set(); // Track processed email UIDs
  }

  // Send email to vendors individually (BCC style - vendors don't see each other)
  async sendRfpEmail({ toEmails, subject, body, rfpData = null }) {
    try {
      if (!Array.isArray(toEmails) || toEmails.length === 0) {
        throw new Error("No recipient emails provided");
      }

      const results = [];
      const htmlTemplate = this.generateHtmlEmail(subject, body, rfpData);

      // Send individually to each vendor
      for (const email of toEmails) {
        try {
          const mailOptions = {
            from: config.EMAIL_ID,
            to: email, // Send to one vendor at a time
            subject: subject || "Request for Proposal",
            text: body || "Please find the RFP details below.",
            html: htmlTemplate,
          };

          const info = await this.transporter.sendMail(mailOptions);
          console.log(`Email sent to ${email}: ${info.messageId}`);

          results.push({
            email,
            success: true,
            messageId: info.messageId,
          });
        } catch (err) {
          console.error(`Failed to send to ${email}:`, err);
          results.push({
            email,
            success: false,
            error: err.message,
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`Sent ${successCount}/${toEmails.length} emails successfully`);

      return {
        success: successCount > 0,
        totalSent: successCount,
        totalFailed: toEmails.length - successCount,
        results,
        sentTo: results.filter(r => r.success).map(r => r.email),
      };
    } catch (error) {
      console.error("Email sending error:", error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  // Generate HTML email template
  generateHtmlEmail(subject, body, rfpData) {
    const bodyHtml = body.replace(/\n/g, "<br>");

    let rfpSection = "";
    if (rfpData) {
      rfpSection = `
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-top: 20px;">
          <h3 style="color: #333;">RFP Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            ${rfpData.title ? `<tr><td style="padding: 5px;"><strong>Title:</strong></td><td style="padding: 5px;">${rfpData.title}</td></tr>` : ""}
            ${rfpData.budget ? `<tr><td style="padding: 5px;"><strong>Budget:</strong></td><td style="padding: 5px;">₹${rfpData.budget}</td></tr>` : ""}
            ${rfpData.delivery_days ? `<tr><td style="padding: 5px;"><strong>Delivery:</strong></td><td style="padding: 5px;">${rfpData.delivery_days} days</td></tr>` : ""}
            ${rfpData.payment_terms ? `<tr><td style="padding: 5px;"><strong>Payment Terms:</strong></td><td style="padding: 5px;">${rfpData.payment_terms}</td></tr>` : ""}
            ${rfpData.warranty_required ? `<tr><td style="padding: 5px;"><strong>Warranty:</strong></td><td style="padding: 5px;">${rfpData.warranty_required}</td></tr>` : ""}
          </table>
        </div>
      `;
    }

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2c3e50;">${subject}</h2>
          <div style="margin: 20px 0;">
            ${bodyHtml}
          </div>
          ${rfpSection}
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #777; font-size: 12px;">
            <p>This is an automated message from RFP Management System</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Start monitoring inbox for new emails
  async startEmailMonitoring(onNewEmail) {
    if (this.isMonitoring) {
      console.log("Email monitoring already running");
      return;
    }

    this.emailCallback = onNewEmail;

    try {
      this.imapClient = new ImapFlow({
        host: "imap.gmail.com",
        port: 993,
        secure: true,
        auth: {
          user: config.EMAIL_ID,
          pass: config.EMAIL_PSSWD,
        },
        logger: false,
      });

      await this.imapClient.connect();
      console.log("✅ IMAP connected - Email monitoring started");

      this.isMonitoring = true;

      // Listen for new emails
      this.imapClient.on("exists", async (data) => {
        console.log(`📧 New email detected: ${data.count} total messages`);
        await this.fetchLatestEmails();
      });

      // Select INBOX
      await this.imapClient.mailboxOpen("INBOX");

      // Fetch recent unread emails on startup
      await this.fetchLatestEmails();
    } catch (error) {
      console.error("Email monitoring error:", error);
      this.isMonitoring = false;
      throw error;
    }
  }

  // Fetch latest unread emails
  async fetchLatestEmails() {
    try {
      if (!this.imapClient) return;

      // Search for unseen emails
      const unseenMessages = await this.imapClient.search({ seen: false });

      if (unseenMessages.length === 0) {
        console.log("No new unread emails");
        return;
      }

      console.log(`Found ${unseenMessages.length} unread emails`);

      for (const uid of unseenMessages) {
        // Skip if already processed
        if (this.processedUIDs.has(uid)) {
          continue;
        }

        try {
          const message = await this.imapClient.fetchOne(uid, {
            source: true,
          });

          const parsed = await simpleParser(message.source);

          const emailData = {
            uid,
            from: parsed.from?.text || "Unknown",
            to: parsed.to?.text || "",
            subject: parsed.subject || "(No Subject)",
            text: parsed.text || "",
            html: parsed.html || "",
            date: parsed.date,
            attachments: parsed.attachments?.map((a) => ({
              filename: a.filename,
              contentType: a.contentType,
              size: a.size,
            })) || [],
            // Include full attachment data with content
            attachmentsData: parsed.attachments?.map((a) => ({
              filename: a.filename,
              contentType: a.contentType,
              size: a.size,
              content: a.content, // Buffer with file content
            })) || [],
          };

        //   console.log(`📬 New email from: ${emailData.from}, Subject: ${emailData.subject}`);

          // Callback with the email data
          if (this.emailCallback) {
            await this.emailCallback(emailData);
          }

          // Mark as processed and seen
          this.processedUIDs.add(uid);
          await this.imapClient.messageFlagsAdd(uid, ["\\Seen"]);
        } catch (err) {
          console.error(`Error processing email ${uid}:`, err);
          // Don't add to processed set if there was an error
        }
      }
    } catch (error) {
      console.error("Fetch emails error:", error);
    }
  }

  // Stop email monitoring
  async stopEmailMonitoring() {
    if (this.imapClient) {
      await this.imapClient.logout();
      this.imapClient = null;
      this.isMonitoring = false;
      console.log("Email monitoring stopped");
    }
  }

  // Get monitoring status
  isMonitoringActive() {
    return this.isMonitoring;
  }
}

export default new EmailService();
