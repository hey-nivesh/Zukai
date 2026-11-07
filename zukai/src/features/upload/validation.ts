/**
 * ZUKAI UPLOAD VALIDATION ENGINE
 * Location: /zukai/src/features/upload/validation.ts
 * Description: Client-side validation for files before initiating upload
 */

export interface FileMetadata {
  name: string;
  size: number;
  mimeType?: string;
  uri: string;
}

export type UploadValidationCode =
  | 'VALID'
  | 'FILE_EMPTY'
  | 'LEGACY_FORMAT'
  | 'UNSUPPORTED_FORMAT'
  | 'FILE_TOO_LARGE'
  | 'DUPLICATE_FILE';

export interface ValidationResult {
  isValid: boolean;
  code: UploadValidationCode;
  title: string;
  message: string;
  cleanExtension: string;
}

const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'pptx', 'txt']);

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
]);

const LEGACY_EXTENSIONS = new Set(['doc', 'ppt', 'xls']);

/**
 * Extracts lowercase extension without dot
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  if (parts.length <= 1) return '';
  return parts[parts.length - 1].toLowerCase().trim();
}

/**
 * Sanitizes display title from filename
 */
export function sanitizeDocumentTitle(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  const cleaned = withoutExt.replace(/[_\\-]+/g, ' ').trim();
  return cleaned.length > 0 ? cleaned.slice(0, 100) : 'Untitled Document';
}

/**
 * Validates a picked file against format, size, and integrity requirements
 */
export function validatePickedFile(
  file: FileMetadata,
  maxSizeBytes: number = 10 * 1024 * 1024 // default 10MB (Free tier)
): ValidationResult {
  const ext = getFileExtension(file.name);

  // 1. Check for 0 bytes / empty file
  if (file.size <= 0) {
    return {
      isValid: false,
      code: 'FILE_EMPTY',
      title: 'Empty File',
      message: 'The selected file contains no readable content (0 bytes).',
      cleanExtension: ext,
    };
  }

  // 2. Check for legacy formats (.doc, .ppt, .xls)
  if (LEGACY_EXTENSIONS.has(ext)) {
    return {
      isValid: false,
      code: 'LEGACY_FORMAT',
      title: 'Legacy Format',
      message: `.${ext.toUpperCase()} is an outdated format. Please open the file in Microsoft Office or Google Docs and save it as .${ext === 'doc' ? 'docx' : 'pptx'}.`,
      cleanExtension: ext,
    };
  }

  // 3. Check extension allowlist
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      isValid: false,
      code: 'UNSUPPORTED_FORMAT',
      title: 'Unsupported File Type',
      message: 'Zukai currently supports PDF, DOCX, PPTX, and TXT documents.',
      cleanExtension: ext,
    };
  }

  // 4. Check MIME type if provided
  if (file.mimeType && file.mimeType !== 'application/octet-stream') {
    const normalizedMime = file.mimeType.toLowerCase();
    // Allow standard match or text plain variants
    const isMimeValid =
      ALLOWED_MIME_TYPES.has(normalizedMime) ||
      (ext === 'txt' && normalizedMime.startsWith('text/')) ||
      (ext === 'pdf' && normalizedMime.includes('pdf'));

    if (!isMimeValid) {
      return {
        isValid: false,
        code: 'UNSUPPORTED_FORMAT',
        title: 'File Content Mismatch',
        message: 'The internal format of this file does not match its file extension.',
        cleanExtension: ext,
      };
    }
  }

  // 5. Check size against tier quota
  if (file.size > maxSizeBytes) {
    const maxMb = Math.round(maxSizeBytes / (1024 * 1024));
    const fileMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      code: 'FILE_TOO_LARGE',
      title: 'File Too Large',
      message: `This file is ${fileMb} MB, which exceeds your plan upload limit of ${maxMb} MB.`,
      cleanExtension: ext,
    };
  }

  return {
    isValid: true,
    code: 'VALID',
    title: 'Valid Document',
    message: 'File is ready for audio conversion.',
    cleanExtension: ext,
  };
}

/**
 * Checks if a matching document was already uploaded recently
 */
export function checkDuplicateDocument(
  file: FileMetadata,
  recentDocuments: { original_filename: string; file_size_bytes: number }[]
): boolean {
  return recentDocuments.some(
    (d) =>
      d.original_filename.toLowerCase() === file.name.toLowerCase() &&
      d.file_size_bytes === file.size
  );
}

