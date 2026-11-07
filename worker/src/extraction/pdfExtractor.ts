import { createRequire } from 'module';
import { ExtractionResult } from './textExtractor.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const data = await pdfParse(buffer);
    const text = (data.text || '').trim();

    if (!text || text.length === 0) {
      throw new Error('SCANNED_NO_TEXT: PDF contains images only without readable text layers.');
    }

    const words = text.split(/\s+/).filter(Boolean);
    const pageCount = data.numpages || Math.max(1, Math.ceil(words.length / 450));

    return {
      text,
      wordCount: words.length,
      pageCount,
    };
  } catch (err: any) {
    if (err.message?.includes('password') || err.message?.includes('encrypted') || err.name === 'PasswordException') {
      throw new Error('PASSWORD_PROTECTED: The PDF is password protected.');
    }
    throw err;
  }
}

