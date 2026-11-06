# Zukai — Limits and Processing Rules
**Document Version:** 1.0.0  
**Scope:** Ingestion Pipeline, Rate Limits, Subscription Quotas, Edge Case Handling

---

## 1. Supported Document Specifications

| Parameter | Free Tier | Pro Tier (Monthly/Annual) | Team Tier (per seat) | Enterprise Tier |
| :--- | :--- | :--- | :--- | :--- |
| **Supported File Formats** | `.pdf`, `.txt` | `.pdf`, `.docx`, `.pptx`, `.txt` | `.pdf`, `.docx`, `.pptx`, `.txt` | `.pdf`, `.docx`, `.pptx`, `.txt`, `.rtf`, `.md` |
| **Max File Upload Size** | 10 MB | 50 MB | 100 MB | 250 MB |
| **Max Page Count / Doc** | 20 pages | 150 pages | 300 pages | 1,000+ pages (Multi-Volume) |
| **Max Input Words / Doc** | 8,000 words | 60,000 words | 120,000 words | 500,000 words |
| **Max Audio Length / Episode** | 8 minutes | 25 minutes | 45 minutes | 90 minutes (Multi-Chapter) |
| **Monthly Audio Minutes** | 45 minutes / month | 450 minutes / month | 1,500 minutes / seat / mo | Custom Pool (Pooled Org Usage) |
| **Concurrent Processing Jobs** | 1 active job | 3 active jobs | 10 concurrent jobs / org | Dedicated Worker Queue |
| **Audio Quality (Bitrate)** | 64 kbps AAC | 128 kbps AAC (High-Def) | 128 kbps AAC (High-Def) | 256 kbps AAC / Lossless FLAC |
| **Audio History Retention** | 14 days | Indefinite (Active sub) | Indefinite | Custom Retention Policy & Legal Hold |
| **Available Depth Modes** | Quick Summary only | Quick, Standard, Deep Dive | Quick, Standard, Deep Dive | Custom Depth & Enterprise Prompts |
| **Workspace Collaboration** | 1 Personal Workspace | 1 Personal Workspace | Up to 25 Members / Org | Unlimited Members / Multi-Org |

---

## 2. Document Processing Edge Cases & Error Handling

```
                      +-----------------------------+
                      |   Uploaded Document Stream  |
                      +--------------+--------------+
                                     |
               +---------------------+---------------------+
               |                     |                     |
     [Format Validation]    [Integrity Check]     [Security Scan]
               |                     |                     |
        Valid Mime?            Encrypted?            Malware / Zero-byte?
        Yes / No               Yes / No              Clean / Infected
```

### 1. Scanned PDFs & Image-Heavy Documents
- **Detection:** Document text extractor yields fewer than 15 words per page, but embedded raster images exist.
- **Handling Strategy:**
  - *Free Tier:* Rejection with clear dialog: *"This PDF contains scanned images without selectable text. Upgrade to Pro to enable Optical Character Recognition (OCR)."*
  - *Pro / Team / Enterprise Tier:* Routed to OCR Ingestion Pipeline (powered by Gemini Vision API). Text is extracted, confidence scores are calculated per block, and low-confidence sections are tagged with an audio disclaimer: *"Note: Some tables in this scanned scan were faint, so figures have been cross-checked with the summary page."*

### 2. Password-Protected & Encrypted Files
- **Detection:** Fastify parser throws `EncryptedPDFError` or `EncryptedOfficeFileException`.
- **Handling Strategy:**
  - Pipeline terminates immediately in the preprocessing stage before sending data to Gemini.
  - Return HTTP 422 with Error Code `FILE_ENCRYPTED`.
  - App surfaces a secure in-app modal: *"This file is password-protected. Enter password to decrypt locally on your device before uploading"* (never store plaintext user passwords on the backend).

### 3. Empty Files & Zero-Byte Payloads
- **Detection:** File byte length equals 0, or document contains whitespace and blank pages only.
- **Handling Strategy:**
  - Fast fail within 500ms at the API Gateway level.
  - Return HTTP 400 with Error Code `FILE_EMPTY`.
  - The client displays the Empty State Mascot (`Zuke-Empty`) with message: *"We couldn't find any readable text in this file. Try uploading another version."*

### 4. Non-Text, Executable, or Corrupted Files
- **Detection:** MIME-type spoofing (e.g., `.exe` renamed to `.pdf`) or broken header signatures.
- **Handling Strategy:**
  - Supabase Storage rejects invalid magic bytes.
  - Fastify worker runs libmagic inspection. Non-conforming binaries trigger security alert, immediate file purge from ephemeral disk, and audit log write.
  - Return Error Code `INVALID_FILE_STRUCTURE`.

### 5. Very Long Documents (Books, 100+ Page Legal Dossiers)
- **Problem:** Processing a 300-page document into a single audio track creates an unmanageable 2-hour audio file, causes high memory consumption on mobile devices, and risks context-window degradation.
- **Solution — "Chapter-Based Audio Episodes" Pipeline:**
  1. The semantic parser scans the Table of Contents and H1/H2 header hierarchies.
  2. The document is segmented into logical "Episodes" of 10–20 pages each.
  3. The app generates an **Audio Playlist / Mini-Series**:
     - *Episode 0:* Executive Summary & Series Roadmap (5 min).
     - *Episode 1:* Chapters 1 & 2 (12 min).
     - *Episode 2:* Chapters 3 & 4 (14 min).
  4. Each episode is processed independently in parallel or lazy-queued on user demand, preserving quotas and reducing waiting time from 8 minutes to under 45 seconds for Episode 0.

### 6. Mixed or Unsupported Languages Within Documents
- **Detection:** Language identification model evaluates text tokens.
- **Rules:**
  - Primary supported languages for MVP: English and Hindi/Hinglish.
  - If a document is in French, Spanish, German, Japanese, or Mandarin:
    - *MVP Action:* The system prompts the user: *"This document is in [Detected Language]. Would you like Zukai to translate and explain it in English or Hinglish?"*
    - The Gemini translation and synthesis layer performs automatic cross-lingual distillation into the requested audio language.
  - If an unsupported minority dialect or unreadable Unicode font encoding is encountered:
    - The worker flags the specific page numbers and provides a faithful audio disclaimer: *"Sections 4 and 5 could not be parsed due to unsupported font encoding, so this explanation focuses on sections 1 through 3."*

