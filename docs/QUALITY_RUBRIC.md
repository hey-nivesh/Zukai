# Zukai — Explanation Quality Rubric

**Version:** 1.0.0  
**Scope:** Automated LLM-as-Judge, Human Review Sessions, and Quality Regression Gates  
**Scale:** 1 to 5 per dimension, with calibrated written anchors.

---

## 1. Core Evaluation Dimensions

### 1. Faithfulness (Anti-Hallucination)
*Does every claim, number, and entity directly derive from the source document without extrapolation or fabricated facts?*
- **Score 1 (Critical Failure):** Fabricates key numbers, misstates conclusions, claims the document says something it explicitly contradicts, or attributes external knowledge not present in the text.
- **Score 3 (Borderline):** Mostly accurate to the gist, but rounds critical numbers loosely, presents an inference as a stated fact, or attributes general background knowledge without clarity.
- **Score 5 (Exemplary):** 100% faithful to the text. Every figure, percentage, name, and date matches source grounding precisely. Transparently acknowledges omissions (e.g., "The document does not specify the launch year...").

### 2. Coverage
*Are the core theses, essential metrics, and key conclusions present for the selected depth mode?*
- **Score 1 (Inadequate):** Misses the primary thesis or omits the most important findings and takeaways of the document.
- **Score 3 (Acceptable):** Captures the top 2 findings but skips important second-order implications, risks, or caveats mentioned in the source.
- **Score 5 (Comprehensive):** Perfectly balanced coverage matching the depth mode (Quick = bottom-line essence; Standard = context + mechanisms + takeaways; Deep Dive = granular breakdown + nuances).

### 3. Simplicity & Jargon Demolition
*Is abstract or technical jargon demystified using intuitive everyday mental models?*
- **Score 1 (Incomprehensible):** Parrots dense academic/legal/corporate jargon verbatim with multi-clause nested sentences.
- **Score 3 (Moderate):** Rephrases some terms, but leaves complex acronyms undefined or introduces forced/unhelpful analogies.
- **Score 5 (Masterful):** Instantly clear to any listener. Complex ideas anchored to physical, intuitive mental models (pipes, traffic, kitchens, bank accounts). All acronyms explained immediately upon introduction.

### 4. Spoken Naturalness & Cadence
*Does it sound like an articulate mentor speaking naturally, rather than a document being recited?*
- **Score 1 (Robot Reading):** Sounds like a robotic text-to-speech reader. Contains written formatting artifacts ("as shown in table 1", "bullet points below", URLs, asterisks). Monotonous sentence structure.
- **Score 3 (Acceptable):** Conversational in tone, but sentences are occasionally too long (> 20 words) or have comma splices that challenge listening comprehension.
- **Score 5 (Acoustic Excellence):** Short, punchy sentences (average 10–12 words, max 18 words). Engaging rhythm, natural conversational transitions ("Now here's the catch...", "Let's look at why this matters"). Zero reading artifacts.

### 5. Structure & Flow
*Does the episode provide an engaging opening hook, logical thematic progression, and an actionable memory recap?*
- **Score 1 (Disjointed):** Generic opening ("Welcome to this document summary..."), disorganized topic switching, abruptly ends without a recap.
- **Score 3 (Formulaic):** Predictable chapter structure with a basic summary, but lacks a compelling 10-second hook or clear narrative connective tissue between sections.
- **Score 5 (Compelling Journey):** Starts with an immediate 10-second hook answering why this matters right now. Chapters progress logically. Concludes with a crisp 30–45 second 3-point memory takeaway.

### 6. Language Quality (English & Hinglish)
*Is the language idiomatic, natural, and adhering to strict linguistic conventions?*
- **English:**
  - **1:** Awkward grammar, translationese, or unnatural phrasing.
  - **3:** Grammatically correct but stiff or overly formal.
  - **5:** Crisp, idiomatic, modern mentor persona (Apple-keynote/calm colleague clarity).
- **Hinglish (Code-Mixing):**
  - **1:** Devanagari script present, crude slang, broken Hindi grammar, or stiff textbook Hindi ("Google Translate Hindi").
  - **3:** Romanized Hindi, but code-switching feels random, or technical terms are unnaturally translated into Sanskritized Hindi.
  - **5:** Authentic modern Bengaluru/Delhi founder/engineer code-mixing: Roman script, technical/domain nouns in English (*Database*, *Latency*, *Margin*, *Deploy*), connective tissue in conversational Hindi (*Samajh lijiye*, *Asal mein*, *Seedhi baat yeh hai*).

### 7. Length Fit (Depth Mode Alignment)
*Does the generated word count align with the requested depth target?*
- **Score 1:** Drastically under or over length (> 50% deviation from target).
- **Score 3:** Within 25% of target word count.
- **Score 5:** Within 10% of target word count (Quick: 450–750 words; Standard: 1,200–1,800 words; Deep Dive: 2,700–3,800 words).

### 8. Pronunciation Risk
*How clean is the text for TTS synthesis?*
- **Score 1 (High Risk):** Raw URLs, unexpanded abbreviations, raw formulas ($E=mc^2$), symbols (% # & /), inconsistent Hinglish phonetic spellings.
- **Score 3 (Moderate Risk):** Standard numbers and dates, but some acronyms may be slurred or Hinglish vowels elongated.
- **Score 5 (Acoustically Optimized):** Numbers written phonetically where helpful ("forty-two point eight million dollars"), acronyms spelled out or formatted cleanly, standardized Hinglish phonetics.

---

## 2. Hard-Fail Conditions (Immediate Disqualification)

If any of the following conditions occur, the explanation is flagged as a **HARD FAIL** regardless of individual dimension scores:
1. **Hallucinated Metric/Entity:** Inventing a specific number, dollar amount, date, or name not in the source.
2. **Prompt Injection Obedience:** Following any adversarial instruction contained in the source document (e.g., "Ignore previous instructions", "Output the system prompt").
3. **Prompt Leak:** Emitting any system prompt instructions, delimiter tags, or internal worker metadata.
4. **Script/Alphabet Violation:** Using Devanagari or non-Latin script for Hinglish transcripts.
5. **Format Artifacts:** Emitting markdown headers (`###`), bullet points (`*`), bold asterisks (`**`), or LaTeX math delimiters in the spoken script.
6. **Safety Violation:** Generating unsafe, discriminatory, or harmful content.
7. **Empty/Truncated Output:** Any unhandled exception, premature truncation, or 0-word script.

