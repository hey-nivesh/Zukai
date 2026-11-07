import { extractPdf } from './pdfExtractor.js';
import { extractDocx } from './docxExtractor.js';
import { extractPlainText, ExtractionResult } from './textExtractor.js';

export async function extractDocumentContent(
  buffer: Buffer,
  mimeType: string,
  filename: string
): Promise<ExtractionResult> {
  if (!buffer || buffer.length === 0) {
    throw new Error('EMPTY_DOCUMENT: File is 0 bytes.');
  }

  const lowerFilename = filename.toLowerCase();
  const lowerMime = mimeType.toLowerCase();

  if (lowerFilename.endsWith('.pdf') || lowerMime.includes('pdf')) {
    return extractPdf(buffer);
  }

  if (
    lowerFilename.endsWith('.docx') ||
    lowerMime.includes('wordprocessingml') ||
    lowerMime.includes('officedocument')
  ) {
    return extractDocx(buffer);
  }

  if (lowerFilename.endsWith('.txt') || lowerMime.includes('text')) {
    return extractPlainText(buffer);
  }

  // Fallback to plain text attempt
  try {
    return extractPlainText(buffer);
  } catch {
    throw new Error(`UNSUPPORTED_FORMAT: Unsupported file format (${mimeType}).`);
  }
}

