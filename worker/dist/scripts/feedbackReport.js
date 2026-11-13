/**
 * ZUKAI LISTENER FEEDBACK AGGREGATION & REPORTING SCRIPT
 * Location: /worker/src/scripts/feedbackReport.ts
 *
 * Queries public.audio_feedback, joins tracks & jobs telemetry,
 * groups by satisfaction, reasons, language, and prompt_version,
 * and outputs a Markdown report to eval/results/FEEDBACK_REPORT.md.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { supabaseAdmin } from '../supabase/client.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export async function generateFeedbackReport() {
    // 1. Fetch all feedback records
    const { data: feedbackList, error: fbError } = await supabaseAdmin
        .from('audio_feedback')
        .select('*')
        .order('created_at', { ascending: false });
    if (fbError) {
        throw new Error(`Failed to query audio_feedback: ${fbError.message}`);
    }
    const feedbacks = feedbackList ?? [];
    // 2. Fetch associated tracks & jobs
    const trackIds = Array.from(new Set(feedbacks.map((f) => f.track_id)));
    const tracksMap = new Map();
    const jobsMap = new Map();
    if (trackIds.length > 0) {
        const { data: tracks } = await supabaseAdmin
            .from('audio_tracks')
            .select('id, job_id, duration_seconds')
            .in('id', trackIds);
        const jobIds = [];
        for (const t of tracks ?? []) {
            tracksMap.set(t.id, t);
            if (t.job_id)
                jobIds.push(t.job_id);
        }
        if (jobIds.length > 0) {
            const { data: jobs } = await supabaseAdmin
                .from('audio_jobs')
                .select('id, language, depth, voice, quality_meta')
                .in('id', jobIds);
            for (const j of jobs ?? []) {
                jobsMap.set(j.id, j);
            }
        }
    }
    // 3. Compute Metrics
    const total = feedbacks.length;
    const positive = feedbacks.filter((f) => f.is_positive).length;
    const negative = total - positive;
    const satisfactionRate = total > 0 ? Math.round((positive / total) * 100) : 100;
    // Reasons breakdown
    const reasonCounts = {};
    for (const fb of feedbacks) {
        for (const reason of fb.reasons || []) {
            reasonCounts[reason] = (reasonCounts[reason] || 0) + 1;
        }
    }
    // Language & Prompt breakdown
    const langCounts = {};
    const promptCounts = {};
    for (const fb of feedbacks) {
        const track = tracksMap.get(fb.track_id);
        const job = track ? jobsMap.get(track.job_id) : null;
        const lang = job?.language || 'unknown';
        const promptVer = job?.quality_meta?.prompt_version || 'pre-v1.3';
        if (!langCounts[lang])
            langCounts[lang] = { total: 0, positive: 0 };
        langCounts[lang].total += 1;
        if (fb.is_positive)
            langCounts[lang].positive += 1;
        if (!promptCounts[promptVer])
            promptCounts[promptVer] = { total: 0, positive: 0 };
        promptCounts[promptVer].total += 1;
        if (fb.is_positive)
            promptCounts[promptVer].positive += 1;
    }
    // 4. Construct Markdown
    const timestamp = new Date().toISOString();
    let md = `# Zukai Listener Feedback & Quality Report\n\n`;
    md += `*Generated: ${timestamp}*\n\n`;
    md += `## 1. Executive Summary\n\n`;
    md += `- **Total Submissions**: ${total}\n`;
    md += `- **Positive (Thumbs Up)**: ${positive} (${satisfactionRate}%)\n`;
    md += `- **Negative (Thumbs Down)**: ${negative}\n\n`;
    md += `## 2. Issues & Negative Feedback Breakdown\n\n`;
    if (Object.keys(reasonCounts).length === 0) {
        md += `*No specific issue reasons reported.*\n\n`;
    }
    else {
        md += `| Reported Issue Reason | Occurrences | % of Total Submissions |\n`;
        md += `| :--- | :--- | :--- |\n`;
        for (const [reason, count] of Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])) {
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            md += `| \`${reason}\` | ${count} | ${pct}% |\n`;
        }
        md += `\n`;
    }
    md += `## 3. Satisfaction by Language\n\n`;
    md += `| Language | Submissions | Positive | Satisfaction Rate |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    for (const [lang, stats] of Object.entries(langCounts)) {
        const rate = stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0;
        md += `| **${lang}** | ${stats.total} | ${stats.positive} | ${rate}% |\n`;
    }
    md += `\n`;
    md += `## 4. Satisfaction by Prompt Version\n\n`;
    md += `| Prompt Version | Submissions | Positive | Satisfaction Rate |\n`;
    md += `| :--- | :--- | :--- | :--- |\n`;
    for (const [ver, stats] of Object.entries(promptCounts)) {
        const rate = stats.total > 0 ? Math.round((stats.positive / stats.total) * 100) : 0;
        md += `| \`${ver}\` | ${stats.total} | ${stats.positive} | ${rate}% |\n`;
    }
    md += `\n`;
    md += `## 5. Recent Comments & Low-Rated Tracks\n\n`;
    const lowRated = feedbacks.filter((f) => !f.is_positive || (f.comment && f.comment.trim().length > 0));
    if (lowRated.length === 0) {
        md += `*No low-rated tracks or user comments recorded.*\n\n`;
    }
    else {
        for (const item of lowRated.slice(0, 10)) {
            md += `### Track \`${item.track_id}\`\n`;
            md += `- **Rating**: ${item.is_positive ? '👍 Positive' : '👎 Negative'} (Score: ${item.rating}/5)\n`;
            md += `- **Reasons**: ${item.reasons.length ? item.reasons.join(', ') : 'None selected'}\n`;
            if (item.comment) {
                md += `- **User Comment**: "${item.comment}"\n`;
            }
            md += `- **Date**: ${item.created_at}\n\n`;
        }
    }
    // Write out to worker/eval/results/FEEDBACK_REPORT.md
    const resultsDir = path.resolve(__dirname, '../../eval/results');
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }
    const outPath = path.join(resultsDir, 'FEEDBACK_REPORT.md');
    fs.writeFileSync(outPath, md, 'utf-8');
    return md;
}
// Run CLI
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    generateFeedbackReport()
        .then((report) => {
        console.log('Feedback report generated successfully!');
        console.log(report);
        process.exit(0);
    })
        .catch((err) => {
        console.error('Error generating feedback report:', err);
        process.exit(1);
    });
}
