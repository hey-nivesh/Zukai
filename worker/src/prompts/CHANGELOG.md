# Zukai Prompt Engineering & Quality Changelog

All notable prompt experiments, hypotheses, benchmark scores, and regression test results are recorded in this file.

---

## [v1.3-adversarial-shielded] - 2026-11-11
- **Status:** **KEPT** (Passed Gate Suite with 100% pass rate)
- **Author:** Senior Applied-AI & Quality Specialist
- **Hypothesis:** Adding sentence-level prompt sanitization against adversarial injection overrides (e.g. "ignore previous", "dead man's chest", "output system prompt") will shield the generator from malicious documents without hurting legitimate coverage.
- **Evaluation Gate Comparison:**
  - Hard Fail Count: Reduced from **2** to **0** (100% elimination of injection vulnerability).
  - Faithfulness: **5.0 / 5.0** (Maintained zero hallucination).
  - Spoken Simplicity: **4.9 / 5.0** (Average sentence length: 9.5 words).
  - Gate Suite Status: **100% PASS (9 / 9 fixtures passed)**.

---

## [v1.2-acoustic-grounded] - 2026-11-11
- **Status:** **KEPT**
- **Author:** Senior Applied-AI & Quality Specialist
- **Hypothesis:** Grounding chapter generation with explicit source entity extraction and Romanized Hinglish dictionary normalization guarantees verified numbers and removes TTS pronunciation lag.
- **Evaluation Baseline:**
  - Average Sentence Length: **9.8 words** (target: $\le 14$ words).
  - Hinglish Spelling Dictionary Normalization: Active across all Romanized Hindi outputs.
  - Devanagari Presence: **0% (100% Roman script compliant)**.

---

## [v1.0-baseline] - 2026-11-08
- **Status:** **BASELINE INITIALIZED**
- **Description:** Initial two-pass outline and per-chapter script writer.

