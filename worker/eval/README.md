# Zukai Evaluation Tools & Human Review Suite

This directory contains automated and human evaluation tooling for measuring explanation quality, tone, and speech naturalness.

---

## 1. Automated Evaluation Suite

- `evalRunner.ts`: Orchestrates deterministic checks and Gemini-as-judge scoring.
  - `npm run eval:smoke`: Runs smoke test across 3 key fixtures.
  - `npm run eval:gate`: Runs full suite and blocks deployment if Faithfulness < 4.8 or Hard Fails > 0.
- `deterministic.ts`: Fast programmatic checks (hard fail injection detection, duration tolerances, formal Hindi stoplist).
- `judge.ts`: Gemini 2.5 Flash judge model with structured Zod rubric output.
- `golden/`: Canonical test fixtures spanning news, research papers, legal clauses, financial reports, textbooks, Indian policy, and adversarial prompts.

---

## 2. Human Review Tool

- `review.html`: Standalone browser-based evaluation workbench.
  - Side-by-side comparison of source document and narration script.
  - Interactive 1–5 scoring with anchor descriptions from `docs/QUALITY_RUBRIC.md`.
  - Immediate hard-fail flagging.
  - One-click JSON export to `human-reviews/`.

### 45-Minute Review Protocol:
1. Double-click `review.html` to open in Chrome or any browser.
2. Paste production source excerpt and generated script (or click **Load Sample**).
3. Listen to the audio while reading the script.
4. Score all 8 dimensions.
5. Click **Export Review JSON** and save the resulting file into `worker/eval/human-reviews/`.

