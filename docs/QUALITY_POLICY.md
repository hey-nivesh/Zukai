# Zukai — Prompt Quality & Regression Policy

**Version:** 1.0.0  
**Scope:** Worker AI Engine, Evaluator Pipeline, CI/CD Gates

---

## 1. The Evidence-First Principle
Every prompt change, temperature adjustment, model swap, or pipeline refactoring must be justified by empirical evaluation data from the **Golden Set** and **Regression Gate Suite**. Intuition or subjective impressions without benchmark numbers are inadmissible.

---

## 2. Prompt Versioning & Storage
1. All prompts are versioned under `worker/src/prompts/` (e.g., `v1_outline.ts`, `v2_outline.ts`).
2. The active version is declared centrally in `worker/src/config.ts` via `PROMPT_VERSION`.
3. Every prompt change requires an entry in `worker/src/prompts/CHANGELOG.md` detailing:
   - Version number and author.
   - Hypothesis tested.
   - Evaluation metrics before vs. after across all 8 rubric dimensions.
   - Outcome: **KEPT** or **REJECTED**.

---

## 3. Automated Gate Suite (`npm run eval:gate`)
Before any prompt change or production release is approved:
1. The **Gate Suite** (covering English, Hinglish, and adversarial edge cases) runs automatically.
2. **Acceptance Thresholds:**
   - **Faithfulness:** $\ge 4.8 / 5.0$ (Zero tolerance for newly introduced hallucinations).
   - **Coverage:** $\ge 4.2 / 5.0$.
   - **Simplicity:** $\ge 4.0 / 5.0$.
   - **Spoken Naturalness:** $\ge 4.0 / 5.0$.
   - **Hard-Fail Rate:** Exactly $0\%$.
3. If any dimension drops by more than $0.20$ or any hard-fail condition triggers, the commit is rejected and rolled back immediately.

---

## 4. Job Tracing & Auditability
Every audio job records its exact generator configuration in Postgres:
- `prompt_version`: Version string (e.g., `v1.2`).
- `model_name`: Exact LLM model ID (e.g., `gemini-1.5-flash`).
- `voice_id`: TTS voice utilized.
- `eval_hash`: Commit hash of prompt logic.

This guarantees that user feedback or quality reports can be traced back to the exact system prompt and model configuration that produced it.

