import { createRequire } from 'module';
import { ExtractedDocument, ExtractedSection } from './extractor.js';
import { WorkerError, WORKER_ERROR_CODES } from '../errors.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export async function extractPdf(buffer: Buffer): Promise<ExtractedDocument> {
  try {
    const data = await pdfParse(buffer);
    const rawText = (data.text || '').trim();

    if (!rawText || rawText.length === 0) {
      throw new WorkerError(
        WORKER_ERROR_CODES.SCANNED_NO_TEXT,
        'This PDF contains scanned images or non-selectable text.',
        false
      );
    }

    const words = rawText.split(/\s+/).filter(Boolean);
    const pageCount = data.numpages || Math.max(1, Math.ceil(words.length / 450));

    // If text density is suspiciously low (< 10 words per page average on multi-page), flag as scanned
    if (pageCount > 1 && words.length / pageCount < 10) {
      throw new WorkerError(
        WORKER_ERROR_CODES.SCANNED_NO_TEXT,
        'This PDF appears to be scanned or contains too little extractable text.',
        false
      );
    }

    // Split text into logical section chunks by double newlines or form feeds
    const rawChunks = rawText.split(/\f|\n\s*\n/).filter((c: string) => c.trim().length > 0);
    const sections: ExtractedSection[] = [];

    let currentSectionText = '';
    let secIndex = 0;

    for (const chunk of rawChunks) {
      currentSectionText += (currentSectionText ? '\n\n' : '') + chunk.trim();
      const chunkWords = currentSectionText.split(/\s+/).length;
      if (chunkWords >= 400) {
        sections.push({
          index: secIndex++,
          title: `Section ${secIndex}`,
          text: currentSectionText,
        });
        currentSectionText = '';
      }
    }

    if (currentSectionText.trim().length > 0) {
      sections.push({
        index: secIndex++,
        title: `Section ${secIndex}`,
        text: currentSectionText,
      });
    }

    return {
      sections: sections.length > 0 ? sections : [{ index: 0, title: 'Overview', text: rawText }],
      metadata: {
        page_count: pageCount,
        word_count: words.length,
        detected_language: 'en',
        has_tables: rawText.includes('---') || rawText.includes('\t'),
        has_images: false,
      },
    };
  } catch (err: unknown) {
    if (err instanceof WorkerError) throw err;
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('password') || msg.includes('encrypted') || (err as any)?.name === 'PasswordException') {
      throw new WorkerError(
        WORKER_ERROR_CODES.PASSWORD_PROTECTED,
        'The PDF is password protected.',
        false
      );
    }
    throw err;
  }
}
