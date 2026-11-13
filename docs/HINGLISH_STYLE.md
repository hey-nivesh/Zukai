# Zukai — Hinglish Style Guide Addendum

**Version:** 1.0.0  
**Scope:** AI Prompts, Romanization Rules, and Speech Synthesis

---

## 1. What is "Zukai Hinglish"?
Zukai Hinglish is **Romanized Hindi mixed naturally with English**. It mirrors how modern Indian founders, software architects, clinicians, and researchers converse in tech hubs like Bengaluru, Hyderabad, Gurugram, Mumbai, and Delhi.

It is **NOT**:
- Broken English or crude street slang (*tapori* / *chhapri* slang).
- Rigid, formal "Google Translate Hindi" using archaic or Sanskritized vocabulary (*jaise "sangnak" for computer ya "durrash" for telephone*).
- Devanagari script (Hindi written in Devanagari causes TTS phonetic lag and reading issues on mobile screens).

---

## 2. Core Linguistic Rules

### Rule 1: Script & Alphabet
- **100% Roman/Latin Alphabet:** Always write in standard English keyboard characters.
- Never use Devanagari (`हिंदी`).

### Rule 2: The Domain Noun Rule (Keep in English)
All professional, technical, business, domain, and measurement nouns remain in **English**:
- **Tech:** *Server, Database, Cloud, Latency, Cache, API, Code, Bug, Microservice, Architecture, Algorithm, Bandwidth.*
- **Finance/Business:** *Revenue, Margin, Profit, EBITDA, Customer, CAC, Churn, Equity, Shares, Valuation, Runway, Balance Sheet.*
- **Everyday & Metrics:** *Percent, Million, Crore, Lakh, Minutes, Hours, Ratio, Target, Graph, Table.*
- **Universal Action Verbs:** *Deploy, Scale, Optimize, Track, Crash, Launch, Manage, Calculate.*

### Rule 3: The Conversational Hindi Connective Tissue
Switch to conversational Hindi for framing ideas, transitions, rhetorical questions, and intuitive mental models:
- *“Seedhi baat yeh hai...”* (The bottom line is...)
- *“Samajh lijiye ki...”* (Think of it as...)
- *“Asal mein hota yeh hai...”* (What actually happens is...)
- *“Matlab yeh hai ki...”* (This means that...)
- *“Ab dekhte hain...”* (Now let's examine...)
- *“Sabse badi problem yeh hai...”* (The biggest challenge is...)
- *“Final takeaway yeh hai...”* (The final takeaway is...)

### Rule 4: Standardized Romanization Spelling Dictionary
To guarantee uniform pronunciation across TTS engines and eliminate transcript spelling mismatches, use these standardized spellings:

| Concept / Word | Standardized Spelling | ❌ Forbidden Variations |
| :--- | :--- | :--- |
| Is / Are | `hai` / `hain` | `hy`, `he`, `hane` |
| What / Why | `kya` / `kyun` | `kyaa`, `kyu`, `qki`, `kyon` |
| Because | `kyunki` | `kyuki`, `coz`, `qki` |
| How | `kaise` | `kese`, `kase` |
| This / That | `yeh` / `woh` | `ye`, `yeh`, `vo`, `wo` |
| Understand | `samajh` | `smjh`, `samjho`, `samaj` |
| Always | `hamesha` | `hmsha`, `hmesha` |
| Completely | `bilkul` | `bilkulll`, `blkl` |
| But | `lekin` / `par` | `pr`, `lkn` |
| Profit / Loss | `fayda` / `nuksan` | `faida`, `fayeda`, `nuksaan` |
| Difference | `farak` | `farq`, `frk` |

### Rule 5: Tone & Politeness Level
- Use the respectful yet warm **"Aap"** pronoun register (*“Aap dekh sakte hain...”*, *“Agar aap notice karein...”*).
- Never use *“Tu”* or overly familiar slang (*“bhai”*, *“yaar”*, *“boss”*).
- Keep sentences short (under 18 words).

---

## 3. "Google Translate Hindi" Anti-Patterns & Replacements

| Stiff / Textbook Hindi (❌ Reject) | Natural Zukai Hinglish (✅ Use) | English Equivalent |
| :--- | :--- | :--- |
| *Pranali* | *System / Architecture* | System |
| *Sanganak* | *Computer / Machine* | Computer |
| *Labhansh* | *Dividend / Profit share* | Dividend |
| *Upyogkarta* | *Users / Customers* | Users |
| *Gananatmak* | *Calculated / Computational* | Computational |
| *Anurodh* | *Request* | Request |
| *Prastutkarta* | *Author / Document* | Author |
| *Vikasit karna* | *Build / Develop karna* | Develop |

