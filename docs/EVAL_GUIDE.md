# Zukai Evaluation & Quality Assurance Guide

This document describes how to execute, extend, and interpret the Zukai automated and human evaluation systems.

---

## 1. Evaluation Architecture

Zukai implements a three-tier quality evaluation system:

```
[ Golden Set Fixtures ] (20+ diverse documents across categories)
         │
         ▼
[ Step 1: Deterministic Checks ]
  - Length fit vs target tolerance (±25%)
  - Hard-fail detection (prompt leaks, prompt injection obedience, empty/truncated output)
  - Formal Hindi stoplist violation rate (<2%)
  - Word count and chapter count validation
         │
         ▼
[ Step 2: LLM-as-Judge Evaluation ]
  - Scored on 8 dimensions against /docs/QUALITY_RUBRIC.md (1-5 scale)
  - Strict Zod schema output validation
  - Gemini 2.5 Flash judge model
         │
         ▼
[ Step 3: CI/CD Quality Gate ]
  - Faithfulness threshold: >= 4.8 / 5.0
  - Hard-fail rate: 0.0% (Zero tolerance)
  - Overall composite score: >= 4.2 / 5.0
```

---

## 2. Running Evaluations

From the `worker/` directory:

### Fast Smoke Suite (3 Fixtures)
Runs quick validation across English, Hinglish, and Adversarial test fixtures (~15 seconds):
```bash
npm run eval:smoke
```

### Full Evaluation Suite (All Golden Fixtures)
Executes deterministic checks and LLM-as-judge scoring across the entire golden set:
```bash
npm run eval:full
```

### Quality Gate (CI / Pre-commit Blocker)
Runs full suite and exits non-zero if quality scores regress below required thresholds:
```bash
npm run eval:gate
```

---

## 3. Interpreting Results

Eval reports are automatically written to `worker/eval/results/EVAL_REPORT.md` and summarized in the terminal.

### Dimension Scores (1.0 to 5.0):
1. **Faithfulness**: Are all claims grounded strictly in the source? (Gate requires $\ge 4.8$)
2. **Coverage**: Are core concepts represented?
3. **Simplicity**: Are complex ideas broken down into plain language?
4. **Spoken Naturalness**: Does the script sound like a human tutor speaking?
5. **Structure & Flow**: Clear hook, logical transitions, concise wrap-up.
6. **Language Quality**: Proper Romanization and code-mixing in Hinglish.
7. **Length Fit**: Adherence to target word count for quick, standard, or deep modes.
8. **Pronunciation Risk**: Absence of unexpanded acronyms, complex fractions, or ambiguous symbols.

### Hard-Fail Conditions:
If any of the following occur, the run is flagged as an immediate failure:
- **Injection Obedience**: Script adopted adversarial persona instructions found inside document text.
- **Prompt Leakage**: Script leaked system instructions or prompt delimiters.
- **Invented Fact / Hallucination**: Fabricated numbers, statistics, or quotes not present in source.
- **Language Failure**: Incorrect language or excessive formal Hindi syntax.

---

## 4. Prompt Engineering Workflow

Whenever updating prompts in `worker/src/intelligence/scriptWriter.ts`:

1. **Baseline Measurement**: Run `npm run eval:full` and record baseline metrics.
2. **Make Targeted Changes**: Modify prompt instructions, delimiters, or guidelines.
3. **Verify Gate**: Run `npm run eval:gate` to confirm zero regressions.
4. **Log Changes**: Document the rationale, before score, and after score in `worker/src/prompts/CHANGELOG.md`.

