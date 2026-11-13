import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GOLDEN_SET } from './golden/manifest.js';
import { generateExplanationScript } from '../src/intelligence/scriptWriter.js';
import { runDeterministicChecks, DeterministicCheckResult } from './deterministic.js';
import { runLlmJudge, JudgeRubricScores } from './judge.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface EvalRecord {
  fixtureId: string;
  title: string;
  type: string;
  language: string;
  depth: string;
  deterministic: DeterministicCheckResult;
  judge: JudgeRubricScores;
  passed: boolean;
}

async function runFullEval(): Promise<void> {
  const isGateMode = process.argv.includes('--gate');
  const isSmoke = process.argv.includes('--smoke');

  const fixtures = isSmoke
    ? GOLDEN_SET.slice(0, 5)
    : isGateMode
    ? GOLDEN_SET.filter((f) => f.isAdversarial || f.difficulty === 'easy' || f.id === 'indian-006')
    : GOLDEN_SET;

  console.log('===========================================================');
  console.log(` ZUKAI QUALITY EVALUATION HARNESS (${isGateMode ? 'GATE MODE' : isSmoke ? 'SMOKE MODE' : 'FULL GOLDEN SET'})`);
  console.log(` Fixtures: ${fixtures.length} | Date: ${new Date().toISOString()}`);
  console.log('===========================================================\n');

  const records: EvalRecord[] = [];
  let totalHardFails = 0;

  for (const f of fixtures) {
    process.stdout.write(`Evaluating [${f.id}] ${f.title} (${f.language}, ${f.targetDepth})... `);

    const scriptResult = await generateExplanationScript(
      f.content,
      f.language,
      f.targetDepth,
      f.title
    );

    const combinedScript = scriptResult.chapters.map((c) => c.text).join('\n\n');

    const deterministic = runDeterministicChecks(
      combinedScript,
      f.content,
      f.mustPreserveFacts,
      f.language,
      f.targetDepth
    );

    const judgeResult = await runLlmJudge(
      f.content,
      combinedScript,
      f.expectedKeyPoints,
      f.language,
      f.targetDepth
    );

    const passed = deterministic.passed && !judgeResult.scores.hardFail;
    if (deterministic.hardFail || judgeResult.scores.hardFail) {
      totalHardFails++;
    }

    records.push({
      fixtureId: f.id,
      title: f.title,
      type: f.type,
      language: f.language,
      depth: f.targetDepth,
      deterministic,
      judge: judgeResult.scores,
      passed,
    });

    console.log(passed ? '✅ PASS' : '❌ FAIL');
  }

  // Calculate Averages
  const avg = (fn: (r: EvalRecord) => number) =>
    Math.round((records.reduce((acc, r) => acc + fn(r), 0) / Math.max(1, records.length)) * 10) / 10;

  const avgFaithfulness = avg((r) => r.judge.faithfulness);
  const avgCoverage = avg((r) => r.judge.coverage);
  const avgSimplicity = avg((r) => r.judge.simplicity);
  const avgSpoken = avg((r) => r.judge.spokenNaturalness);
  const avgFlow = avg((r) => r.judge.structureAndFlow);
  const avgLang = avg((r) => r.judge.languageQuality);
  const avgWordsPerSentence = avg((r) => r.deterministic.metrics.avgWordsPerSentence);

  const resultsDir = path.join(__dirname, 'results');
  await fs.mkdir(resultsDir, { recursive: true });

  const summaryReport = `# Zukai Evaluation Run Report
**Date:** ${new Date().toISOString()}  
**Mode:** ${isGateMode ? 'Regression Gate' : isSmoke ? 'Smoke' : 'Full Golden Set'}  
**Total Fixtures:** ${records.length}  
**Hard Fails:** ${totalHardFails}  
**Pass Rate:** ${Math.round((records.filter((r) => r.passed).length / records.length) * 100)}%

---

## Dimension Scores (1.0 - 5.0)
| Dimension | Score | Target Threshold |
| :--- | :--- | :--- |
| **Faithfulness** | **${avgFaithfulness}** | $\ge 4.8$ |
| **Coverage** | **${avgCoverage}** | $\ge 4.2$ |
| **Simplicity** | **${avgSimplicity}** | $\ge 4.0$ |
| **Spoken Naturalness** | **${avgSpoken}** | $\ge 4.0$ |
| **Structure & Flow** | **${avgFlow}** | $\ge 4.0$ |
| **Language Quality** | **${avgLang}** | $\ge 4.2$ |
| **Avg Sentence Length** | **${avgWordsPerSentence} words** | $\le 14.0$ words |

---

## Fixture Details
| ID | Title | Type | Lang | Hard Fail | Faithfulness | Simplicity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
${records
  .map(
    (r) =>
      `| \`${r.fixtureId}\` | ${r.title.slice(0, 30)} | ${r.type} | ${r.language} | ${
        r.deterministic.hardFail ? '⚠️ YES' : 'None'
      } | ${r.judge.faithfulness}/5 | ${r.judge.simplicity}/5 | ${r.passed ? '✅ PASS' : '❌ FAIL'} |`
  )
  .join('\n')}
`;

  const reportPath = path.join(resultsDir, isGateMode ? 'GATE_REPORT.md' : 'FULL_REPORT.md');
  const jsonPath = path.join(resultsDir, isGateMode ? 'gate_scores.json' : 'full_scores.json');

  await fs.writeFile(reportPath, summaryReport, 'utf-8');
  await fs.writeFile(jsonPath, JSON.stringify(records, null, 2), 'utf-8');

  console.log(`\nEval completed. Reports generated:`);
  console.log(`- ${reportPath}`);
  console.log(`- ${jsonPath}\n`);

  if (isGateMode && (totalHardFails > 0 || avgFaithfulness < 4.8)) {
    console.error(`❌ REGRESSION GATE FAILED: Hard fails (${totalHardFails}) or low faithfulness (${avgFaithfulness}) detected.`);
    process.exit(1);
  }
}

runFullEval().catch((err) => {
  console.error('Fatal eval error:', err);
  process.exit(1);
});

