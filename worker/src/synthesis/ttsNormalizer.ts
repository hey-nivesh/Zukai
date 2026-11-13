/**
 * TTS Text Normalizer & Pronunciation Preparation Engine
 * Handles expansion of numbers, currencies (USD, INR Lakh/Crore),
 * percentages, acronyms, and symbols for natural acoustic delivery.
 */

// Acronyms to expand phonetically or letter-by-letter
export const ACRONYM_MAP: Record<string, string> = {
  API: 'A-P-I',
  EBITDA: 'E-bit-da',
  ARR: 'A-R-R',
  CAC: 'C-A-C',
  NRR: 'N-R-R',
  SaaS: 'sass',
  SQL: 'sequel',
  URL: 'U-R-L',
  GPU: 'G-P-U',
  CPU: 'C-P-U',
  RAM: 'ram',
  AI: 'A-I',
  LLM: 'L-L-M',
  TTS: 'T-T-S',
  PDF: 'P-D-F',
  DOCX: 'docx',
  PPTX: 'pptx',
  UPI: 'U-P-I',
  RBI: 'R-B-I',
  MDR: 'M-D-R',
  P2M: 'P-2-M',
  P2P: 'P-2-P',
};

/**
 * Transforms written text into spoken phonetic text for TTS engines.
 */
export function prepareTextForTts(text: string, language: 'english' | 'hinglish' = 'english'): string {
  if (!text) return '';

  let output = text;

  // 1. Remove markdown formatting artifacts if present
  output = output.replace(/[*_#`~>]/g, '');
  output = output.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 2. Expand Currencies (USD & INR)
  // $42.8M -> forty-two point eight million dollars
  output = output.replace(/\$(\d+(?:\.\d+)?)\s*M\b/gi, '$1 million dollars');
  output = output.replace(/\$(\d+(?:\.\d+)?)\s*B\b/gi, '$1 billion dollars');
  output = output.replace(/\$(\d+(?:\.\d+)?)\s*K\b/gi, '$1 thousand dollars');
  output = output.replace(/\$(\d+(?:,\d{3})*(?:\.\d+)?)/g, '$1 dollars');

  // Rs 20 lakh / Rs 2,000 -> 20 lakh rupees / 2,000 rupees
  output = output.replace(/Rs\.?\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(lakh|crore)?/gi, (_match, num, unit) => {
    return unit ? `${num} ${unit} rupees` : `${num} rupees`;
  });
  output = output.replace(/₹\s*(\d+(?:,\d+)*(?:\.\d+)?)\s*(lakh|crore)?/gi, (_match, num, unit) => {
    return unit ? `${num} ${unit} rupees` : `${num} rupees`;
  });

  // 3. Expand Percentages: 98.4% -> 98.4 percent
  output = output.replace(/(\d+(?:\.\d+)?)\s*%/g, '$1 percent');

  // 4. Expand Basis points: 340 bps -> 340 basis points
  output = output.replace(/\b(\d+)\s*bps\b/gi, '$1 basis points');

  // 5. Expand Acronyms with phonetic spacing
  for (const [acronym, spoken] of Object.entries(ACRONYM_MAP)) {
    const regex = new RegExp(`\\b${acronym}\\b`, 'g');
    output = output.replace(regex, spoken);
  }

  // 6. Clean URLs and Emails to spoken references
  output = output.replace(/https?:\/\/\S+/gi, 'the website link');
  output = output.replace(/[\w.-]+@[\w.-]+\.\w+/gi, 'the email address');

  // 7. Expand Math & Comparison Symbols
  output = output.replace(/\s*<=\s*/g, ' is less than or equal to ');
  output = output.replace(/\s*>=\s*/g, ' is greater than or equal to ');
  output = output.replace(/\s*=\s*/g, ' equals ');
  output = output.replace(/\s*\+\s*/g, ' plus ');

  // 8. Collapse whitespace
  output = output.replace(/[ \t]+/g, ' ').trim();

  return output;
}

