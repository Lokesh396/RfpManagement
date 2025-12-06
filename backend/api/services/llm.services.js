import OpenAI from "openai";
import config from "../../config/config.js";

class LLMService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: config.OPEN_AI_API_KEY,
    });
  }

  async extractRFPFromText(text) {
    try {
      const prompt = `You are an expert procurement assistant. Extract structured RFP information from the following text.

Text: "${text}"

Extract and return a JSON object with the following fields:
- title: A concise title for this RFP (max 100 chars)
- items: Array of items to be procured. Each item should have:
  - name: item name
  - qty: quantity (number)
  - specs: object with specifications (if mentioned)
- budget: Total budget amount (number, null if not mentioned)
- delivery_days: Number of days for delivery (number, null if not mentioned)
- payment_terms: Payment terms as string (null if not mentioned)
- warranty_required: Warranty requirement as string (null if not mentioned)

Return ONLY valid JSON, no additional text.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that extracts structured procurement data from natural language. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      const extracted = JSON.parse(content);

      // Validate and normalize the structure
      return {
        title: extracted.title || text.split(".")[0].slice(0, 100) || "Untitled RFP",
        items: Array.isArray(extracted.items) ? extracted.items : [],
        budget: extracted.budget !== undefined ? extracted.budget : null,
        delivery_days: extracted.delivery_days !== undefined ? extracted.delivery_days : null,
        payment_terms: extracted.payment_terms || null,
        warranty_required: extracted.warranty_required || null,
      };
    } catch (error) {
      console.error("LLM extraction error:", error);

      // Fallback to simple extraction on error
      return {
        title: text.split(".")[0].slice(0, 100) || "Untitled RFP",
        items: [],
        budget: null,
        delivery_days: null,
        payment_terms: null,
        warranty_required: null,
      };
    }
  }

  async generateEmailContent(rfp) {
    try {
      const prompt = `Generate a professional email to send to vendors for the following RFP:

Title: ${rfp.title}
Items: ${rfp.items ? JSON.stringify(rfp.items) : "Not specified"}
Budget: ${rfp.budget || "Not specified"}
Delivery: ${rfp.delivery_days ? rfp.delivery_days + " days" : "Not specified"}
Payment Terms: ${rfp.payment_terms || "Not specified"}
Warranty: ${rfp.warranty_required || "Not specified"}

Generate:
1. A professional email subject line
2. A well-formatted email body

Return as JSON with fields: subject, body`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a professional procurement officer. Generate formal business emails.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      const result = JSON.parse(content);

      return {
        subject: result.subject || `RFP: ${rfp.title}`,
        body: result.body || "Please review the attached RFP.",
      };
    } catch (error) {
      console.error("Email generation error:", error);

      // Fallback template
      return {
        subject: `RFP: ${rfp.title}`,
        body: `Dear Vendor,\n\nWe are requesting proposals for: ${rfp.title}\n\nPlease submit your best quote.\n\nRegards,\nProcurement Team`,
      };
    }
  }
  async extractProposalFromText(text, emailSubject = '') {
    try {
      const prompt = `You are an expert procurement assistant. Extract structured proposal/quotation information from the following vendor response.

Email Subject: ${emailSubject}

Proposal Text:
"${text}"

Extract and return a JSON object with the following fields:
- vendor_name: Vendor/Company name (string, extract from signature or header)
- total_price: Total quoted price (number, null if not mentioned)
- unit_price: Price per unit if mentioned (number, null if not applicable)
- items: Array of quoted items with their prices and specs
- delivery_days: Delivery timeline in days (number, null if not mentioned)
- payment_terms: Payment terms offered (string, null if not mentioned)
- warranty: Warranty offered (string, null if not mentioned)
- additional_terms: Any additional terms and conditions (string, null if not mentioned)
- contact_person: Contact person name (string, null if not mentioned)
- contact_email: Contact email (string, null if not mentioned)
- contact_phone: Contact phone (string, null if not mentioned)

Return ONLY valid JSON, no additional text.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that extracts structured proposal data from vendor responses. Always respond with valid JSON only.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      const extracted = JSON.parse(content);

      return {
        vendor_name: extracted.vendor_name || "Unknown Vendor",
        total_price: extracted.total_price !== undefined ? extracted.total_price : null,
        unit_price: extracted.unit_price !== undefined ? extracted.unit_price : null,
        items: Array.isArray(extracted.items) ? extracted.items : [],
        delivery_days: extracted.delivery_days !== undefined ? extracted.delivery_days : null,
        payment_terms: extracted.payment_terms || null,
        warranty: extracted.warranty || null,
        additional_terms: extracted.additional_terms || null,
        contact_person: extracted.contact_person || null,
        contact_email: extracted.contact_email || null,
        contact_phone: extracted.contact_phone || null,
      };
    } catch (error) {
      console.error("Proposal extraction error:", error);

      return {
        vendor_name: "Unknown Vendor",
        total_price: null,
        unit_price: null,
        items: [],
        delivery_days: null,
        payment_terms: null,
        warranty: null,
        additional_terms: null,
        contact_person: null,
        contact_email: null,
        contact_phone: null,
        extraction_error: error.message,
      };
    }
  }

  async analyzeProposals(rfpData, proposals) {
    try {
      const prompt = `You are an expert procurement analyst. Analyze the following vendor proposals for an RFP and provide a comprehensive comparison.

RFP Requirements:
${JSON.stringify(rfpData, null, 2)}

Vendor Proposals:
${JSON.stringify(proposals, null, 2)}

Analyze each proposal based on:
1. Price competitiveness (total cost and value for money)
2. Delivery timeline compliance
3. Payment terms favorability
4. Warranty and support offered
5. Vendor credibility and experience
6. Overall risk assessment

Provide a JSON response with:
- comparison: Array of objects with vendor_name, strengths[], weaknesses[], score (0-100)
- recommendation: {
    recommended_vendor: "vendor name",
    reasoning: "detailed explanation",
    confidence_level: "high|medium|low",
    key_factors: ["factor1", "factor2", ...]
  }
- risks: Array of potential risks for each vendor
- summary: Overall analysis summary

Return ONLY valid JSON, no additional text.`;

      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert procurement analyst. Analyze vendor proposals objectively and provide actionable insights.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.4,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Empty response from OpenAI");
      }

      return JSON.parse(content);
    } catch (error) {
      console.error("Proposal analysis error:", error);

      return {
        comparison: proposals.map(p => ({
          vendor_name: p.vendor_name,
          strengths: [],
          weaknesses: [],
          score: 0
        })),
        recommendation: {
          recommended_vendor: "Unable to analyze",
          reasoning: "Analysis failed: " + error.message,
          confidence_level: "low",
          key_factors: []
        },
        risks: [],
        summary: "Analysis could not be completed due to an error.",
        error: error.message
      };
    }
  }
}

export default new LLMService();
 
