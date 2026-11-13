import { ExtractedDocument, ExtractedSection } from './extractor.js';
import { WorkerError, WORKER_ERROR_CODES } from '../errors.js';

export function extractPlainText(buffer: Buffer): ExtractedDocument {
  // Normalize line endings and strip BOM
  let text = buffer.toString('utf-8');
  if (text.charCodeAt(0) === 0xfeff) {
    text = text.slice(1);
  }
  text = text.replace(/\r\n/g, '\n').trim();

  if (text.length === 0) {
    throw new WorkerError(
      WORKER_ERROR_CODES.EMPTY_DOCUMENT,
      'File contains no text content.',
      false
    );
  }

  const words = text.split(/\s+/).filter(Boolean);
  const estimatedPages = Math.max(1, Math.ceil(words.length / 450));

  // Chunk by paragraphs
  const rawParagraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const sections: ExtractedSection[] = [];
  let currentBlock = '';
  let secIndex = 0;

  for (const para of rawParagraphs) {
    currentBlock += (currentBlock ? '\n\n' : '') + para.trim();
    if (currentBlock.split(/\s+/).length >= 400) {
      sections.push({
        index: secIndex++,
        title: `Section ${secIndex}`,
        text: currentBlock,
      });
      currentBlock = '';
    }
  }

  if (currentBlock.trim().length > 0) {
    sections.push({
      index: secIndex++,
      title: `Section ${secIndex}`,
      text: currentBlock,
    });
  }

  return {
    sections: sections.length > 0 ? sections : [{ index: 0, title: 'Document', text }],
    metadata: {
      page_count: estimatedPages,
      word_count: words.length,
      detected_language: 'en',
      has_tables: text.includes('\t') || text.includes('|---'),
      has_images: false,
    },
  };
}
