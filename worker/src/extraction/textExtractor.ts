export interface ExtractionResult {
  text: string;
  wordCount: number;
  pageCount: number;
}

export function extractPlainText(buffer: Buffer): ExtractionResult {
  const text = buffer.toString('utf-8').trim();
  if (text.length === 0) {
    throw new Error('EMPTY_DOCUMENT: File contains no text content.');
  }

  const words = text.split(/\s+/).filter(Boolean);
  const estimatedPages = Math.max(1, Math.ceil(words.length / 450));

  return {
    text,
    wordCount: words.length,
    pageCount: estimatedPages,
  };
}

