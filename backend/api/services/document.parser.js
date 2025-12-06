import fs from 'fs/promises';
import path from 'path';
import mammoth from 'mammoth';
import xlsx from 'xlsx';
import { PDFParse } from 'pdf-parse';  // Corrected to named import

class DocumentParser {

  async parseAttachment(attachment, buffer) {
    const filename = attachment.filename || 'unknown';
    const ext = path.extname(filename).toLowerCase();

    try {
      switch (ext) {
        case '.pdf':
          return await this.parsePDF(buffer);

        case '.docx':
        case '.doc':
          return await this.parseDOCX(buffer);

        case '.xlsx':
        case '.xls':
          return await this.parseExcel(buffer);

        case '.txt':
          return buffer.toString('utf-8');

        default:
          return `[Unsupported file type: ${ext}]`;
      }
    } catch (error) {
      console.error(`Error parsing ${filename}:`, error);
      return `[Error parsing file: ${error.message}]`;
    }
  }

  async parsePDF(buffer) {
    try {
      // Convert Buffer to Uint8Array as required by pdf-parse v2.4.5
      const uint8Array = new Uint8Array(buffer);
      const pdfParser = new PDFParse(uint8Array);
      const data = await pdfParser.getText();
      return data;
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  async parseDOCX(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return result.value;
    } catch (error) {
      throw new Error(`DOCX parsing failed: ${error.message}`);
    }
  }

  parseExcel(buffer) {
    try {
      const workbook = xlsx.read(buffer, { type: 'buffer' });
      let text = '';
      
      workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        text += `\n=== ${sheetName} ===\n`;
        text += xlsx.utils.sheet_to_csv(sheet);
      });
      
      return text;
    } catch (error) {
      throw new Error(`Excel parsing failed: ${error.message}`);
    }
  }

  async saveAttachment(attachment, buffer, baseDir) {
    try {
      const timestamp = Date.now();
      const safeFilename = attachment.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}_${safeFilename}`;
      const filepath = path.join(baseDir, filename);
      
      await fs.writeFile(filepath, buffer);
      return { filepath, filename };
    } catch (error) {
      console.error('Error saving attachment:', error);
      throw error;
    }
  }
}

export default new DocumentParser();