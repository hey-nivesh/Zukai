import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { extractDocumentContent } from '../src/extraction/extractor.js';
import { generateExplanationScript } from '../src/intelligence/scriptWriter.js';
import { synthesizeSpeech } from '../src/synthesis/ttsEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface FixtureResult {
  fixture: string;
  format: string;
  extractedWords: number;
  extractedPages: number;
  chaptersCount: number;
  audioDurationSec: number;
  audioFormat: string;
  costMicros: number;
  passed: boolean;
}

const FIXTURES = [
  {
    name: 'cloud_architecture.txt',
    content: `Horizontal auto-scaling is triggered when aggregate CPU utilization exceeds an eighty percent threshold for three consecutive evaluation windows. This spins up ephemeral worker nodes to mitigate request queuing. When traffic recedes below forty percent, the autoscaler initiates graceful termination of excess instances, preserving session persistence through centralized Redis caches.`,
    language: 'english' as const,
    depth: 'quick' as const,
  },
  {
    name: 'financial_earnings.txt',
    content: `Consolidated Adjusted EBITDA expanded by 340 bps year-over-year to $42.8M, driven predominantly by post-merger SG&A synergies and amortization schedule reallocations, despite ongoing macro-headwinds in European retail channel inventory turnover. Free cash flow conversion stood at seventy-eight percent.`,
    language: 'english' as const,
    depth: 'standard' as const,
  },
  {
    name: 'biotech_mrna.txt',
    content: `The lipid nanoparticle encapsulates synthetic nucleoside-modified messenger RNA encoding the viral spike glycoprotein, transfecting host ribosomes to initiate transient antigen synthesis without genomic integration or viral replication. Cellular immune responses are primed within fourteen days.`,
    language: 'english' as const,
    depth: 'standard' as const,
  },
  {
    name: 'hinglish_startup_pitch.txt',
    content: `Seedhi baat yeh hai: jaise hi aapke system pe traffic badhta hai aur processor capacity eighty percent paar karti hai, Zukai system wait nahi karta. Yeh automatically naye backup servers start kar deta hai. Matlab agar achanak lakhon users bhi aa jayein, toh app crash nahi hogi aur users ko koi loading delay nahi milega.`,
    language: 'hinglish' as const,
    depth: 'quick' as const,
  },
];

async function runEvaluation(): Promise<void> {
  console.log('====================================================');
  console.log('       ZUKAI PHASE 6 WORKER EVALUATION HARNESS       ');
  console.log('====================================================\n');

  const results: FixtureResult[] = [];

  for (const f of FIXTURES) {
    console.log(`Processing Fixture: ${f.name} (${f.language}, ${f.depth})...`);
    const buffer = Buffer.from(f.content, 'utf-8');

    const extracted = await extractDocumentContent(buffer, 'text/plain', f.name);
    const script = await generateExplanationScript(
      extracted.sections.map((s) => s.text).join('\n\n'),
      f.language,
      f.depth,
      f.name
    );
    const audio = await synthesizeSpeech(script.chapters, 'alloy');

    const result: FixtureResult = {
      fixture: f.name,
      format: 'txt',
      extractedWords: extracted.metadata.word_count,
      extractedPages: extracted.metadata.page_count,
      chaptersCount: script.chapters.length,
      audioDurationSec: audio.durationSeconds,
      audioFormat: audio.format,
      costMicros: script.costMicros,
      passed: audio.durationSeconds > 0 && script.chapters.length >= 1,
    };

    results.push(result);
    console.log(`  ✓ Result: ${result.audioDurationSec}s audio, ${result.chaptersCount} chapters, format: ${result.audioFormat}`);
  }

  // Generate Markdown report
  let md = `# Zukai Phase 6 Worker Evaluation Report\n\n`;
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `**Total Fixtures Tested:** ${results.length}\n`;
  md += `**Success Rate:** ${(results.filter((r) => r.passed).length / results.length) * 100}%\n\n`;
  md += `| Fixture | Extracted Words | Chapters | Audio Duration | Format | Cost (Micros) | Status |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const r of results) {
    md += `| \`${r.fixture}\` | ${r.extractedWords} words | ${r.chaptersCount} | ${r.audioDurationSec}s | \`${r.audioFormat}\` | ${r.costMicros} | ${r.passed ? '✅ PASS' : '❌ FAIL'} |\n`;
  }

  const reportPath = path.join(__dirname, 'EVAL_REPORT.md');
  await fs.writeFile(reportPath, md, 'utf-8');
  console.log(`\nEvaluation complete! Report saved to ${reportPath}\n`);
}

runEvaluation().catch((e) => {
  console.error('Evaluation run failed:', e);
  process.exit(1);
});

