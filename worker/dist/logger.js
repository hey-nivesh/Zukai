import pino from 'pino';
// Strict redaction list: tokens, keys, passwords, signatures, signed URLs.
// Under no circumstances should document text, raw files, or audio transcripts be logged.
export const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    redact: {
        paths: [
            'req.headers.authorization',
            'req.headers["x-service-role-key"]',
            'headers.authorization',
            'key',
            'apiKey',
            'GEMINI_API_KEY',
            'SUPABASE_SERVICE_ROLE_KEY',
            'password',
            'token',
            'secret',
            'signedUrl',
            'url.*.token',
            'url.*.signature',
            '*.rawText',
            '*.documentText',
            '*.transcript',
            '*.script',
        ],
        censor: '[REDACTED]',
    },
    transport: process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
            },
        }
        : undefined,
});
