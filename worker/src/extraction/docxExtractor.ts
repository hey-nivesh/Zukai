import mammoth from 'mammoth';
import { ExtractionResult } from './textExtractor.js';

export async function extractDocx(buffer: Buffer): Promise<ExtractionResult> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value.trim();

    if (!text || text.length === 0) {
      throw new Error('SCANNED_NO_TEXT: Document does not contain extractable text.');
    }

    const words = text.split(/\s+/).filter(Boolean);
    const estimatedPages = Math.max(1, Math.ceil(words.length / 450));

    return {
      text,
      wordCount: words.length,
      pageCount: estimatedPages,
    };
  } catch (err: any) {
    if (err.message?.includes('encrypted') || err.message?.includes('password')) {
      throw new Error('PASSWORD_PROTECTED: Word document is encrypted with a password.');
    }
    throw err;
  }
}

