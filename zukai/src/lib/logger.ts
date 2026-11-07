/**
 * ZUKAI SECURE LOGGER
 * Enforces redaction of sensitive data: JWTs, bearer tokens, passwords, emails.
 * Safe for use in development and error telemetry.
 */

// Regex patterns to detect sensitive data
const TOKEN_PATTERN = /ey[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+/g; // JWT pattern
const EMAIL_PATTERN = /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g;
const SENSITIVE_KEYS = ['password', 'passwordConfirmation', 'token', 'access_token', 'refresh_token', 'secret', 'service_role'];

function redactString(str: string): string {
  return str
    .replace(TOKEN_PATTERN, '[REDACTED_JWT]')
    .replace(EMAIL_PATTERN, (match) => {
      const [name, domain] = match.split('@');
      if (!name || !domain) return '[REDACTED_EMAIL]';
      return `${name[0]}***@${domain}`;
    });
}

function redactObject(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[MAX_DEPTH]';
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    return redactString(obj);
  }

  if (obj instanceof Error) {
    return {
      name: obj.name,
      message: redactString(obj.message),
      stack: isDev ? obj.stack : undefined,
    };
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => redactObject(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const redacted: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redactObject(val, depth + 1);
      }
    }
    return redacted;
  }

  return obj;
}

const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

export const logger = {
  log: (...args: unknown[]) => {
    if (isDev) {
      const sanitized = args.map((a) => redactObject(a));
      console.log(...sanitized);
    }
  },
  warn: (...args: unknown[]) => {
    const sanitized = args.map((a) => redactObject(a));
    console.warn(...sanitized);
  },
  error: (...args: unknown[]) => {
    const sanitized = args.map((a) => redactObject(a));
    console.error(...sanitized);
  },
};
