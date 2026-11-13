export const WORKER_ERROR_CODES = {
  UNSUPPORTED_FILE: 'UNSUPPORTED_FILE',
  PASSWORD_PROTECTED: 'PASSWORD_PROTECTED',
  SCANNED_NO_TEXT: 'SCANNED_NO_TEXT',
  EMPTY_DOCUMENT: 'EMPTY_DOCUMENT',
  TOO_MANY_PAGES: 'TOO_MANY_PAGES',
  DOCUMENT_TOO_LONG: 'DOCUMENT_TOO_LONG',
  CONTENT_BLOCKED: 'CONTENT_BLOCKED',
  AI_UNAVAILABLE: 'AI_UNAVAILABLE',
  TTS_FAILED: 'TTS_FAILED',
  ASSEMBLY_FAILED: 'ASSEMBLY_FAILED',
  STORAGE_ERROR: 'STORAGE_ERROR',
  CANCELED: 'CANCELED',
  INTERNAL: 'INTERNAL',
} as const;

export type WorkerErrorCode = keyof typeof WORKER_ERROR_CODES;

export interface ErrorDetails {
  code: WorkerErrorCode;
  message: string;
  isRetryable: boolean;
}

export class WorkerError extends Error {
  public readonly code: WorkerErrorCode;
  public readonly isRetryable: boolean;

  constructor(code: WorkerErrorCode, message: string, isRetryable = false) {
    super(message);
    this.name = 'WorkerError';
    this.code = code;
    this.isRetryable = isRetryable;
  }
}

export function mapErrorToCode(err: unknown): ErrorDetails {
  if (err instanceof WorkerError) {
    return {
      code: err.code,
      message: err.message,
      isRetryable: err.isRetryable,
    };
  }

  const msg = err instanceof Error ? err.message : String(err);

  if (msg.includes('password') || msg.includes('encrypted') || msg.includes('decrypt')) {
    return {
      code: WORKER_ERROR_CODES.PASSWORD_PROTECTED,
      message: 'This document is encrypted or password-protected. Please remove the password and try again.',
      isRetryable: false,
    };
  }

  if (msg.includes('SAFETY') || msg.includes('blocked') || msg.includes('HARM_CATEGORY')) {
    return {
      code: WORKER_ERROR_CODES.CONTENT_BLOCKED,
      message: 'Processing could not proceed due to automated content and safety review.',
      isRetryable: false,
    };
  }

  if (msg.includes('429') || msg.includes('ResourceExhausted') || msg.includes('quota')) {
    return {
      code: WORKER_ERROR_CODES.AI_UNAVAILABLE,
      message: 'The AI explanation engine is experiencing high demand. Please try again in a moment.',
      isRetryable: true,
    };
  }

  if (msg.includes('ECONNRESET') || msg.includes('ETIMEDOUT') || msg.includes('fetch failed')) {
    return {
      code: WORKER_ERROR_CODES.INTERNAL,
      message: 'A transient network interruption occurred while communicating with the processing pipeline.',
      isRetryable: true,
    };
  }

  return {
    code: WORKER_ERROR_CODES.INTERNAL,
    message: 'An unexpected processing error occurred. Our team has been notified.',
    isRetryable: true,
  };
}

