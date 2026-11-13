# Adding a New Language to Zukai

This guide outlines the standard operating procedure for expanding Zukai beyond English and Hinglish to support additional languages (e.g., Spanish, Tamil, Marathi, French, or German).

---

## Architecture Overview

Zukai treats language support as a full-pipeline capability, consisting of five core layers:
1. **Database & API Layer**: Language enums in Supabase and TypeScript schemas.
2. **Intelligence / Script Generation Layer**: System prompts, style rules, and structural constraints.
3. **Pronunciation & Normalization Layer**: Phonetic expansions, number normalization, and glossary rules for TTS.
4. **Speech Synthesis Layer**: Engine voice selection, neural speech sampling, and LUFS calibration.
5. **Evaluation & Quality Gate Layer**: Golden fixtures, deterministic grammar/pronunciation checks, and LLM-as-judge scoring.

---

## Step 1: Database & Type Definitions

1. **Supabase Migration**:
   Create a new migration to add the language code to the database check constraints:
   ```sql
   alter table public.audio_jobs
     drop constraint if exists audio_jobs_language_check,
     add constraint audio_jobs_language_check check (language in ('english', 'hinglish', 'new_lang'));
   ```

2. **TypeScript Types**:
   Update `zukai/src/types/database.ts` and `worker/src/supabase/rpc.ts`:
   ```ts
   export type AudioLanguage = 'english' | 'hinglish' | 'new_lang';
   ```

3. **Client App UI**:
   Add the language option to the onboarding language screen (`zukai/src/app/(onboarding)/language.tsx`) and Settings profile view.

---

## Step 2: Prompt Engineering & Style Rules

1. **Create Language Style Guide**:
   Author `docs/<LANG>_STYLE.md` detailing:
   - Target tone (conversational, professional tutor).
   - Code-mixing policy (if applicable) or purity guidelines.
   - Stop-words, banned jargon, and forbidden idioms.

2. **Update Script Generator (`worker/src/intelligence/scriptWriter.ts`)**:
   Add a language-specific branch to Pass A (outline) and Pass B (chapters):
   ```ts
   if (language === 'new_lang') {
     systemPrompt += `\nGenerate the narration in natural, conversational ${language}...`;
   }
   ```
   Ensure adversarial shielding instructions (anti-injection tags) are maintained.

---

## Step 3: Text Normalization & Pronunciation Dictionary

1. **Glossary & Anti-patterns**:
   Create `worker/src/<lang>/glossary.ts`:
   - Mapping of common acronyms (e.g., `AI`, `API`, `USD`) to phonetic local equivalents.
   - List of common TTS mispronunciation overrides.
   - Stop-list for formal/archaic words that sound stiff in spoken audio.

2. **TTS Normalizer Integration (`worker/src/synthesis/ttsNormalizer.ts`)**:
   Wire currency, measurement unit, and ordinal number expansion for the new locale.

---

## Step 4: TTS Engine & Voice Calibration

1. **Select Neural Voices**:
   Configure high-fidelity neural voices for the target language in `worker/src/config.ts` and `zukai/src/features/jobs/voicesConfig.ts`.
2. **Audio Calibration**:
   - Run test synthesis and verify loudness matches `-16 LUFS (±1.0 LUFS)`.
   - Ensure word boundaries and karaoke segment timestamps align accurately.

---

## Step 5: Golden Fixtures & Evaluation Gate

1. **Expand Golden Set (`worker/eval/golden/manifest.ts`)**:
   Add at least 5 new representative fixtures in the target language:
   - 1 General News article
   - 1 Technical or Business document
   - 1 Educational textbook excerpt
   - 1 Adversarial injection test
2. **Run Quality Evaluation**:
   Execute:
   ```bash
   npm run eval:smoke
   npm run eval:gate
   ```
   **Pass Requirement**:
   - Faithfulness $\ge 4.8 / 5.0$
   - Hard-fail rate $= 0\%$
   - Naturalness $\ge 4.2 / 5.0$

