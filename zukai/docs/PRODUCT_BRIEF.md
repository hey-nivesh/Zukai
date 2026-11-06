# Zukai — Product Brief
**Document Version:** 1.0.0  
**Status:** Approved for Architecture Planning  
**Tagline:** *Listen to understand.*

---

## 1. Executive Summary & Vision

In the modern enterprise and knowledge economy, reading volume has exploded while human attention spans have compressed. Professionals, students, and operators are overwhelmed by dense PDFs, slide decks, strategy memos, and compliance mandates. The average reader drops off before reaching page 4 of a 20-page document. Traditional text-to-speech (TTS) engines merely vocalize verbatim text—including tables, footnotes, and legalese—amplifying cognitive friction rather than alleviating it.

**Zukai** solves this structural failure. Zukai is an enterprise-grade mobile platform that transforms dense, complex documents (`.pdf`, `.docx`, `.pptx`, `.txt`, and later images and web URLs) into ultra-clear, highly engaging audio explanations. Instead of reading verbatim text, Zukai’s intelligence layer analyzes the document, discards navigational noise, extracts core mental models, and writes a script designed specifically for spoken comprehension. Listeners can consume explanations in crisp **English** or conversational **Romanized Hinglish** (the vernacular of over 500 million bilingual professionals across South Asia and global diaspora).

---

## 2. Problem Statement

1. **Cognitive Fatigue & High Reading Drop-off:** Knowledge workers spend 20–30% of their working hours reading technical documents, industry reports, and internal specifications. Retention is poor, and critical insights remain buried.
2. **Failure of Verbatim Audio (Screen Readers / Basic TTS):** Tools like Speechify or generic operating system readers convert raw text word-for-word. Hearing bullet numbers, URLs, table headers, and academic boilerplate spoken aloud destroys comprehension and induces auditory fatigue within minutes.
3. **The Language Barrier in Spoken Knowledge:** Millions of bilingual knowledge workers read formal documents in English but think, synthesize, and converse naturally in a hybrid blend of English and their regional vernacular (Hinglish). Existing audio tools are strictly unilingual, formal, and alienating.
4. **Enterprise Knowledge Desynchronization:** Large organizations struggle with enablement. Field teams (sales, customer success, field engineers) do not read 80-page product whitepapers or compliance guidelines, leading to misalignment, compliance violations, and lost deals.

---

## 3. Target Users & Personas

### Persona Matrix

| Dimension | Persona 1: The Fast-Paced Student | Persona 2: The Commuting Executive | Persona 3: The Enterprise Team Lead |
| :--- | :--- | :--- | :--- |
| **Name** | **Aryan (22)** | **Priya (34)** | **Marcus (42)** |
| **Role** | Final-year CS / MBA Student | Senior Strategy Consultant | VP of Global Sales Enablement |
| **Organization** | Tier-1 University | Top-tier Strategy Firm | Enterprise SaaS (500+ Reps) |
| **Primary Device** | Android (Pixel / Samsung Galaxy) | Android (Samsung Ultra) | Android & Web Portal |
| **Reading Material** | Research papers, textbook chapters, case studies | 60-page analyst reports, pitch decks, market research | Product whitepapers, competitive battlecards, security docs |
| **Language Preference**| Hinglish & English | English & Hinglish | English |
| **Primary Context** | Gym, late-night study, public transit | Morning cab commute, airport lounges, between client meetings | Training programs, team onboarding, field updates |

### Detailed Jobs-to-be-Done (JTBD)

#### Aryan (Student)
- **When** I am assigned a 35-page research paper or textbook chapter late at night,
- **I want to** upload the PDF and listen to a simplified 10-minute explanation while walking or working out,
- **So I can** grasp the core mechanisms, prepare for seminars without burning out, and retain the underlying concepts.

#### Priya (Consultant)
- **When** a client sends an unsolicited 80-page financial disclosure or vendor report 45 minutes before a strategy call,
- **I want to** generate a concise 7-minute "Standard" audio briefing on my phone during my commute,
- **So I can** walk into the boardroom knowing the critical numbers, potential risks, and strategic takeaways without having skimmed frantically.

#### Marcus (Enterprise Enablement)
- **When** our product and engineering teams release a massive 120-page compliance and technical architecture guide,
- **I want to** generate audio episodes for our team workspace with tracked listening progress and verifiable audit trails,
- **So I can** ensure our global field teams actually understand what we sell without forcing them to read dense documentation.

---

## 4. Value Proposition & Competitive Moat

```
+-----------------------------------------------------------------------------+
|                                    ZUKAI                                    |
|                   "Listen to Understand" (Synthesis Layer)                  |
|  * Semantic Document Parsing      * Script Writing for the Ear              |
|  * Real-world Analogies           * Romanized Hinglish & English            |
|  * Multi-tier Depth Control       * Enterprise RBAC & Workspace Analytics   |
+-----------------------------------------------------------------------------+
                                       VS
+------------------------------------+----------------------------------------+
| Traditional TTS (Speechify, Pocket)| Long-form Audiobooks (Audible, Blinkist|
| - Verbatim robotic read-aloud      | - Limited strictly to published books  |
| - Reads tables, links, boilerplate | - Cannot ingest proprietary enterprise |
| - High auditory fatigue            |   documents, PDFs, or ad-hoc memos     |
| - English/Unilingual only          | - Static, one-size-fits-all scripts    |
+------------------------------------+----------------------------------------+
```

### Key Differentiators:
1. **Designed for the Ear, Not the Eye:** Text written for reading is packed with subordinate clauses and bibliographic citations. Zukai rewrites the document before generating audio: short sentences, rhetorical anchors ("Here's why that matters..."), and clear milestones.
2. **Native Conversational Hinglish:** Seamless Romanized code-mixing that mirrors how South Asian professionals explain concepts over coffee: technical nouns in English, connective tissue and verbs in natural colloquial Hindustani.
3. **Structured Depth Modes:** Users select cognitive depth (`Quick Summary` for 3–5 min, `Standard` for 8–12 min, `Deep Dive` for 18–25 min episode chapters).
4. **Enterprise Governance from Day One:** Zero data leakage, per-tenant data isolation (`org_id` partitioned), strict role-based access control, SOC2-ready audit logging, and team-wide usage analytics.

---

## 5. Scope Boundaries

```
[ Phase 0 Architecture & Planning ] ---> [ Phase 1-6 MVP Launch ] ---> [ Phase 7+ Enterprise Expansion ]
```

### In-Scope for MVP (Phase 1–6)
- **File Uploads:** Local Android file picker supporting `.pdf`, `.docx`, `.pptx`, `.txt` up to 25 MB and 100 pages.
- **AI Processing Pipeline:**
  - Multi-stage document parser (text extraction, structural outline, table stripping).
  - Script synthesizer via Gemini 1.5 Flash with strict factual grounding prompts.
  - Audio generation via Gemini TTS with natural prosody.
- **Language Support:** English (Global) and Hinglish (Romanized Hindi-English blend).
- **Explanation Depth Modes:** Quick Summary (3-5 min), Standard (8-12 min), Deep Dive (multi-chapter up to 25 min).
- **Audio Player:** Background playback, variable speed (0.75x to 2.5x), 15s seek skip, persistent lockscreen media controls, real-time synchronized transcript scrolling.
- **Organization & Multi-Tenancy:** Personal workspace + single organization support with basic RBAC (Owner, Admin, Member).
- **Monetization:** Google Play In-App Billing via RevenueCat (Free Tier vs. Pro Subscription).

### Explicitly NOT in MVP (Deferred to Later Phases)
- Camera OCR / physical book scanning (Phase 8).
- Web URL scraping and live web article ingestion (Phase 7).
- YouTube video-to-audio explanation (Phase 9).
- Two-way voice interactive Q&A during playback (Phase 10).
- Regional Indian languages (Tamil, Telugu, Marathi, Bengali audio) (Phase 11).
- Custom Enterprise Single Sign-On (SAML / Okta / Azure AD SCIM) (Phase 12).
- Offline native audio batch caching for international flights (Phase 7).

---

## 6. Success Metrics & Key Performance Indicators (KPIs)

| Metric Category | Metric Name | Definition | Target Baseline (90 Days Post-Launch) |
| :--- | :--- | :--- | :--- |
| **Activation** | First-Day Listen Rate | % of new signups who generate and listen to $\ge 1$ audio track within 24h of install | $\ge 58.0\%$ |
| **Usage Frequency** | Documents Processed | Average count of documents uploaded and converted per Active User / Week | $\ge 4.2 \text{ docs/user/week}$ |
| **Engagement** | Listen-Through Rate (LTR) | Completed listening minutes divided by total generated minutes | $\ge 76.5\%$ |
| **Retention** | Day 1 Retention ($D_1$) | % of users returning on Day 1 | $\ge 48.0\%$ |
| **Retention** | Day 7 Retention ($D_7$) | % of users returning on Day 7 | $\ge 32.0\%$ |
| **Retention** | Day 30 Retention ($D_{30}$) | % of users returning on Day 30 | $\ge 21.0\%$ |
| **Unit Economics** | Cost per Audio Minute | Total processing cost (Gemini parsing + script generation + TTS synthesis) | $\le \$0.0038 \text{ / minute}$ |
| **Unit Economics** | Gross Margin | Net subscription revenue minus cloud AI and storage compute costs | $\ge 78.5\%$ |
| **Quality** | Hallucination / Distortion Rate | Reported inaccuracies or unfaithful facts per 1,000 processed jobs | $\le 0.15\%$ (audit verified) |
