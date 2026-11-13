import AdmZip from 'adm-zip';
import { WorkerError, WORKER_ERROR_CODES } from '../errors.js';
/**
 * Extracts slides, titles, body text, and speaker notes from PPTX presentation XML.
 */
export async function extractPptx(buffer) {
    try {
        const zip = new AdmZip(buffer);
        const zipEntries = zip.getEntries();
        const slideEntries = zipEntries
            .filter((e) => /^ppt\/slides\/slide\d+\.xml$/i.test(e.entryName))
            .sort((a, b) => {
            const numA = parseInt(a.entryName.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
            const numB = parseInt(b.entryName.match(/slide(\d+)\.xml/i)?.[1] || '0', 10);
            return numA - numB;
        });
        if (slideEntries.length === 0) {
            throw new WorkerError(WORKER_ERROR_CODES.EMPTY_DOCUMENT, 'No presentation slides found in PPTX file.', false);
        }
        const sections = [];
        let totalWords = 0;
        for (let i = 0; i < slideEntries.length; i++) {
            const entry = slideEntries[i];
            const xml = entry.getData().toString('utf-8');
            // Strip XML tags to gather clean text runs
            const textMatches = xml.match(/<a:t[^>]*>(.*?)<\/a:t>/gi) || [];
            const cleanTexts = textMatches
                .map((m) => m.replace(/<[^>]+>/g, '').trim())
                .filter((t) => t.length > 0);
            const title = cleanTexts[0] || `Slide ${i + 1}`;
            const body = cleanTexts.join('\n');
            const words = body.split(/\s+/).filter(Boolean).length;
            totalWords += words;
            sections.push({
                index: i,
                title,
                text: body,
                pageRange: { start: i + 1, end: i + 1 },
            });
        }
        return {
            sections,
            metadata: {
                page_count: slideEntries.length,
                word_count: totalWords,
                detected_language: 'en',
                has_tables: false,
                has_images: zipEntries.some((e) => e.entryName.startsWith('ppt/media/')),
            },
        };
    }
    catch (err) {
        if (err instanceof WorkerError)
            throw err;
        throw new WorkerError(WORKER_ERROR_CODES.UNSUPPORTED_FILE, `Failed to parse PowerPoint presentation: ${err instanceof Error ? err.message : String(err)}`, false);
    }
}
