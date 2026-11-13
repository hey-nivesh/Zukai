import mammoth from 'mammoth';
import { WorkerError, WORKER_ERROR_CODES } from '../errors.js';
export async function extractDocx(buffer) {
    try {
        const result = await mammoth.extractRawText({ buffer });
        const rawText = (result.value || '').trim();
        if (!rawText || rawText.length === 0) {
            throw new WorkerError(WORKER_ERROR_CODES.EMPTY_DOCUMENT, 'Word document does not contain readable text.', false);
        }
        const words = rawText.split(/\s+/).filter(Boolean);
        const estimatedPages = Math.max(1, Math.ceil(words.length / 450));
        // Split on double line breaks into structured paragraphs
        const paragraphs = rawText.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
        const sections = [];
        let currentBlock = '';
        let secIndex = 0;
        for (const para of paragraphs) {
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
            sections: sections.length > 0 ? sections : [{ index: 0, title: 'Overview', text: rawText }],
            metadata: {
                page_count: estimatedPages,
                word_count: words.length,
                detected_language: 'en',
                has_tables: rawText.includes('\t'),
                has_images: result.messages.some((m) => m.type === 'warning' && m.message.includes('image')),
            },
        };
    }
    catch (err) {
        if (err instanceof WorkerError)
            throw err;
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('encrypted') || msg.includes('password')) {
            throw new WorkerError(WORKER_ERROR_CODES.PASSWORD_PROTECTED, 'Word document is encrypted with a password.', false);
        }
        throw err;
    }
}
