import {
  validatePickedFile,
  getFileExtension,
  sanitizeDocumentTitle,
  checkDuplicateDocument,
  FileMetadata,
} from '../src/features/upload/validation';
import { calculateDepthEstimates, estimateSourceWords } from '../src/features/upload/estimation';

describe('Upload Validation Engine', () => {
  it('extracts lowercase file extension correctly', () => {
    expect(getFileExtension('Report.PDF')).toBe('pdf');
    expect(getFileExtension('my.complex.notes.docx')).toBe('docx');
    expect(getFileExtension('noextension')).toBe('');
  });

  it('sanitizes document titles cleanly', () => {
    expect(sanitizeDocumentTitle('Q3_Market_Analysis-v2.pdf')).toBe('Q3 Market Analysis v2');
    expect(sanitizeDocumentTitle('simple.txt')).toBe('simple');
  });

  it('rejects empty (0 byte) files', () => {
    const file: FileMetadata = {
      name: 'empty.pdf',
      size: 0,
      mimeType: 'application/pdf',
      uri: 'file://cache/empty.pdf',
    };
    const result = validatePickedFile(file);
    expect(result.isValid).toBe(false);
    expect(result.code).toBe('FILE_EMPTY');
  });

  it('rejects legacy formats (.doc, .ppt) with friendly conversion instructions', () => {
    const file: FileMetadata = {
      name: 'legacy.doc',
      size: 1024,
      mimeType: 'application/msword',
      uri: 'file://cache/legacy.doc',
    };
    const result = validatePickedFile(file);
    expect(result.isValid).toBe(false);
    expect(result.code).toBe('LEGACY_FORMAT');
    expect(result.message).toContain('save it as .docx');
  });

  it('rejects unsupported extensions (.zip, .exe)', () => {
    const file: FileMetadata = {
      name: 'archive.zip',
      size: 2048,
      mimeType: 'application/zip',
      uri: 'file://cache/archive.zip',
    };
    const result = validatePickedFile(file);
    expect(result.isValid).toBe(false);
    expect(result.code).toBe('UNSUPPORTED_FORMAT');
  });

  it('rejects files exceeding plan size limit', () => {
    const file: FileMetadata = {
      name: 'huge_book.pdf',
      size: 25 * 1024 * 1024, // 25 MB
      mimeType: 'application/pdf',
      uri: 'file://cache/huge_book.pdf',
    };
    const result = validatePickedFile(file, 10 * 1024 * 1024); // 10MB limit
    expect(result.isValid).toBe(false);
    expect(result.code).toBe('FILE_TOO_LARGE');
    expect(result.message).toContain('exceeds your plan upload limit of 10 MB');
  });

  it('approves valid PDF within limit', () => {
    const file: FileMetadata = {
      name: 'quarterly_brief.pdf',
      size: 4 * 1024 * 1024, // 4 MB
      mimeType: 'application/pdf',
      uri: 'file://cache/quarterly_brief.pdf',
    };
    const result = validatePickedFile(file, 10 * 1024 * 1024);
    expect(result.isValid).toBe(true);
    expect(result.code).toBe('VALID');
  });

  it('detects duplicate files by name and size', () => {
    const file: FileMetadata = {
      name: 'annual_report.pdf',
      size: 1048576,
      uri: 'file://cache/annual_report.pdf',
    };
    const recent = [
      { original_filename: 'annual_report.pdf', file_size_bytes: 1048576 },
      { original_filename: 'other.pdf', file_size_bytes: 2048 },
    ];
    expect(checkDuplicateDocument(file, recent)).toBe(true);

    const nonDuplicate: FileMetadata = {
      name: 'new_deck.pptx',
      size: 5000,
      uri: 'file://cache/new_deck.pptx',
    };
    expect(checkDuplicateDocument(nonDuplicate, recent)).toBe(false);
  });
});

describe('Audio Duration & Word Estimation Engine', () => {
  it('estimates source words based on format density', () => {
    const pdfWords = estimateSourceWords(22000, 'pdf');
    expect(pdfWords).toBeGreaterThan(500);

    const txtWords = estimateSourceWords(6000, 'txt');
    expect(txtWords).toBeCloseTo(1000, -2);
  });

  it('calculates duration estimates for quick, standard, and deep modes', () => {
    const estimates = calculateDepthEstimates(5000);
    expect(estimates.quick.estimatedMinutes).toBeLessThan(estimates.standard.estimatedMinutes);
    expect(estimates.standard.estimatedMinutes).toBeLessThan(estimates.deep.estimatedMinutes);
    expect(estimates.quick.estimatedMinutes).toBeGreaterThanOrEqual(3);
    expect(estimates.deep.estimatedMinutes).toBeLessThanOrEqual(35);
  });
});

