# Zukai — Strategic Risks, Mitigations & Open Questions
**Document Version:** 1.0.0  
**Scope:** Architecture Risk Matrix, Security/Compliance Guardrails, and Open Decisions

---

## 1. Top Technical & Business Risks and Mitigations

### Risk 1: Hinglish TTS Quality & Phonetic Glitches
- **The Threat:** Standard Text-to-Speech models frequently butcher bilingual code-mixed text. When an English TTS model encounters a Romanized Hindi word like *samajh*, it may pronounce it as *"sah-madge"*, ruining immersion and credibility. Conversely, an Indian English accent reading pure English technical terms may sound overly synthesized.
- **Severity:** High (Core differentiator risk).
- **Engineering Mitigation Strategy:**
  1. **Two-Stage Phonetic Normalizer in Fastify Worker:** Before sending any Hinglish script to Gemini TTS, the script passes through a regex and phoneme dictionary lookup table:
     - `samajh` $\rightarrow$ SSML `<phoneme alphabet="ipa" ph="səmədʒʱ">samajh</phoneme>` or phonetic respelling `samajh`.
     - Technical terms remain wrapped in English language tags `<lang xml:lang="en-US">database</lang>`.
  2. **Strict Romanized Hinglish Prompt Guidelines:** As defined in `EXPLANATION_STYLE_GUIDE.md`, prompts instruct Gemini to use established Romanized spellings with unambiguous vowel pairings.
  3. **Voice Preset Calibration:** Benchmark Gemini TTS voices (`Puck`, `Fenrir`, `Aoede`) against a curated test corpus of 50 Hinglish enterprise paragraphs to lock the highest-performing voice model.

---

### Risk 2: Long-Document Processing Costs & Token Explosions
- **The Threat:** A single 200-page enterprise PDF contains over 80,000 words (~110,000 tokens). Passing the entire document multiple times through Gemini 1.5 Pro and generating 45 minutes of continuous TTS audio can cost upwards of $0.45 per job, destroying gross margins on a $9.99/month subscription.
- **Severity:** High (Unit economics risk).
- **Engineering Mitigation Strategy:**
  1. **Hierarchical "Map-Reduce" Chunking:** The Fastify worker extracts the document outline (H1/H2 headings), generates a high-level semantic skeleton using Gemini 1.5 Flash (extremely cost-efficient: \$0.075 per million tokens), and produces the summary script without feeding redundant raw pages into the synthesis context.
  2. **Demand-Driven "Chapter Episode" Generation:** Very long documents are not processed into a single massive audio file. Only Episode 0 (Executive Summary) is generated immediately upon upload. Subsequent chapters (Episodes 1, 2, 3) are synthesized on-demand when the user presses play or queues them, eliminating wasted synthesis spend on abandoned tracks.
  3. **Strict Quota Metering:** Free tier enforces hard 20-page and 8-minute audio limits; Pro tier enforces monthly audio minute pools (450 min/mo) tracked in `usage_events`.

---

### Risk 3: Confidential Data Handling & Enterprise Privacy
- **The Threat:** Enterprise users upload sensitive intellectual property, financial audit drafts, proprietary algorithms, and legal briefs. Any risk that user data is cached or used to train public foundation models is a dealbreaker for corporate adoption.
- **Severity:** Critical (Enterprise compliance risk).
- **Engineering Mitigation Strategy:**
  1. **Enterprise Zero Data Retention API Terms:** Google Cloud Vertex AI / Gemini API commercial enterprise agreements explicitly stipulate that customer input prompts and output generations are never logged to public models or used for model training.
  2. **Ephemeral Document Processing in Worker:** The Fastify worker stores raw files in memory or encrypted `/tmp` RAM disks during parsing, immediately discarding unneeded artifacts.
  3. **Supabase AES-256 Storage & Envelope Encryption:** Uploaded documents are stored in private Supabase storage buckets with customer-specific tenant isolation keys.
  4. **Client-Side Sensitive PII Masking:** Fastify worker runs a fast pre-flight NER (Named Entity Recognition) pass to redact credit card numbers, social security IDs, and specified client tokens before sending the payload to the LLM.

---

### Risk 4: Google Play In-App Billing Compliance & Policy Shocks
- **The Threat:** Google Play policy changes around digital subscriptions, AI-generated content disclosures, and billing fees (15% - 30% take rates) can delay app approval or cause sudden rejection.
- **Severity:** Medium (Go-to-market risk).
- **Engineering Mitigation Strategy:**
  1. **RevenueCat Abstraction Layer:** By abstracting Play Billing behind the RevenueCat SDK, receipts and entitlements are validated server-side. If Google Play alters billing specifications, RevenueCat handles backend SDK shifts without forcing an emergency app update.
  2. **Transparent AI Content Disclaimers:** In accordance with Google Play's 2024 AI policy directives, the app clearly displays a badge on all generated tracks: *"Synthesized by Zukai AI. Audio explanations are generated from user-provided source documents."*
  3. **One-Tap Subscription Cancellation:** The settings screen links directly to `play.google.com/store/account/subscriptions`, satisfying Google Play's mandatory subscription cancellation guidelines.

---

## 2. Key Open Questions for Your Decision

Before proceeding with Phase 1, the following strategic product decisions require your sign-off:

1. **Default Voice Persona & Identity:**  
   Do you want the default narrator voice to be male, female, or user-selectable during first-time onboarding? (Recommendation: Offer one flagship warm female voice and one flagship articulate male voice during onboarding).

2. **Free Tier Quota Strategy:**  
   Should the Free Tier offer **3 documents per month (up to 45 total minutes)**, or a **7-day unlimited trial** that converts to a 1-document-per-month sandbox? (Recommendation: 45 minutes / month renewable quota retains active daily users and builds habits).

3. **Hinglish Toggle Granularity:**  
   Should language selection be a global app setting (e.g. "Always explain in Hinglish"), or an explicit choice per document upload? (Recommendation: Set a global default in Profile, but provide an inline toggle on the document upload sheet).

4. **Multi-Tenancy Rollout in MVP:**  
   For MVP, should the UI display team workspace features immediately (Invite, Share with Team), or keep the UI focused 100% on individual productivity until Phase 7? (Recommendation: Keep data model 100% multi-tenant with `org_id` now, but keep the Team tab tucked under a "Workspaces" toggle so solo users have zero clutter).

5. **Audio Download / Offline Caching:**  
   Should Free users be allowed to export audio files (MP3/AAC) outside the app, or should downloads be restricted strictly to Pro subscribers? (Recommendation: Pro-only download export; Free users can only stream inside the Zukai app).

