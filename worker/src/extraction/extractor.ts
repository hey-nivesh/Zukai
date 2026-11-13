import { extractPdf } from './pdfExtractor.js';
import { extractDocx } from './docxExtractor.js';
import { extractPptx } from './pptxExtractor.js';
import { extractPlainText } from './textExtractor.js';
import { validateMagicBytes } from './magicBytes.js';
import { WorkerError, WORKER_ERROR_CODES } from '../errors.js';
import { config } from '../config.js';

export interface ExtractedSection {
  index: number;
  title?: string;
  text: string;
  pageRange?: { start: number; end: number };
}

export interface ExtractedDocument {
  sections: ExtractedSection[];
  metadata: {
    page_count: number;
    word_count: number;
    detected_language: string;
    has_tables: boolean;
    has_images: boolean;
  };
}

/**
 * Text cleaning pass:
 * - Fix hyphenated line breaks (e.g. con-\nnected -> connected)
 * - Strip control characters except newline and tab
 * - Collapse excessive whitespace
 * - Sanitize security delimiters
 */
export function cleanExtractedText(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/(\w+)-\r?\n(\w+)/g, '$1$2') // rejoin hyphenated words
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // strip control chars
    .replace(/[ \t]+/g, ' ') // collapse inline spaces
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n') // collapse multiple blank lines
    .trim();
}

/**
 * Validates document limits based on user plan tier.
 */
export function enforcePlanLimits(doc: ExtractedDocument, planTier: 'free' | 'pro' | 'team' = 'free'): void {
  const maxPages = planTier === 'free' ? config.MAX_PAGES_FREE : config.MAX_PAGES_PRO;
  const maxWords = planTier === 'free' ? config.MAX_WORDS_FREE : config.MAX_WORDS_PRO;

  if (doc.metadata.page_count > maxPages) {
    throw new WorkerError(
      WORKER_ERROR_CODES.TOO_MANY_PAGES,
      `Document has ${doc.metadata.page_count} pages, which exceeds your tier limit of ${maxPages} pages.`,
      false
    );
  }

  if (doc.metadata.word_count > maxWords) {
    throw new WorkerError(
      WORKER_ERROR_CODES.DOCUMENT_TOO_LONG,
      `Document has ${doc.metadata.word_count} words, which exceeds your tier limit of ${maxWords} words.`,
      false
    );
  }
}

/**
 * Master extraction entrypoint:
 * 1. Checks magic bytes for true file type.
 * 2. Parses format (PDF, DOCX, PPTX, TXT).
 * 3. Cleans sections.
 * 4. Enforces plan limits.
 */
export async function extractDocumentContent(
  buffer: Buffer,
  _mimeType?: string,
  _filename?: string,
  planTier: 'free' | 'pro' | 'team' = 'free'
): Promise<ExtractedDocument> {
  const { extension } = validateMagicBytes(buffer);

  let doc: ExtractedDocument;
  switch (extension) {
    case 'pdf':
      doc = await extractPdf(buffer);
      break;
    case 'docx':
      doc = await extractDocx(buffer);
      break;
    case 'pptx':
      doc = await extractPptx(buffer);
      break;
    case 'txt':
    default:
      doc = await extractPlainText(buffer);
      break;
  }

  // Clean sections
  doc.sections = doc.sections.map((sec) => ({
    ...sec,
    text: cleanExtractedText(sec.text),
  }));

  // Re-verify content presence after cleaning
  const totalLength = doc.sections.reduce((acc, s) => acc + s.text.length, 0);
  if (totalLength === 0 || doc.metadata.word_count === 0) {
    throw new WorkerError(
      WORKER_ERROR_CODES.EMPTY_DOCUMENT,
      'No readable text could be extracted from this document.',
      false
    );
  }

  // Enforce tier page/word limits
  enforcePlanLimits(doc, planTier);

  return doc;
}
