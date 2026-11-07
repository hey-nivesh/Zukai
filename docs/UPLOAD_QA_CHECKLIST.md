# Zukai — Upload & Ingestion QA Checklist
**Document Version:** 1.0.0  
**Phase:** Phase 5 (Upload, Validation, TUS Resumable Pipeline & Job Creation)

---

## 1. File Type Acceptance & Pre-Upload Validation

| Test Case | Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| **TC-UP-01: Standard PDF** | Pick a valid `.pdf` document (e.g. 5 MB). | File accepted, summary card shown, upload begins. | [ ] |
| **TC-UP-02: Office Word DOCX** | Pick a valid `.docx` document. | File accepted, formatted as DOCX, options active. | [ ] |
| **TC-UP-03: Presentation PPTX** | Pick a valid `.pptx` slide deck. | File accepted, words estimated, options active. | [ ] |
| **TC-UP-04: Plain Text TXT** | Pick a `.txt` file. | File accepted, word count calculated, options active. | [ ] |
| **TC-UP-05: Empty File (0 Bytes)** | Pick a zero-byte file (`empty.pdf`). | Blocked with Error Banner: *"The selected file contains no readable content (0 bytes)."* | [ ] |
| **TC-UP-06: Legacy Word (.doc)** | Pick a legacy `.doc` or `.ppt` file. | Blocked with Error Banner: *"Legacy format detected. Please save as .docx before uploading."* | [ ] |
| **TC-UP-07: Unsupported Binary** | Pick an archive `.zip` or executable `.apk`. | Blocked with Error Banner: *"Unsupported file type. Zukai supports PDF, DOCX, PPTX, and TXT."* | [ ] |
| **TC-UP-08: File Size Limit (Free)** | Pick a 12 MB file on Free tier (10 MB cap). | Blocked with Error Banner: *"File exceeds your plan upload limit of 10 MB."* | [ ] |
| **TC-UP-09: Duplicate Detection** | Pick the same document twice in succession. | Warning Banner: *"Duplicate Document. You recently uploaded this document."* Options: *Cancel* or *Upload Anyway*. | [ ] |

---

## 2. Resumable Upload Engine (TUS & Network Reliability)

| Test Case | Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| **TC-NET-01: 6MB Chunking** | Upload a 20 MB PDF over network. | Monitor network logs: Payload is transmitted in exact 6MB slices via PATCH requests. | [ ] |
| **TC-NET-02: Airplane Mode Mid-Upload** | Turn on Airplane mode at 50% upload progress. | Upload automatically pauses, status changes to "Upload paused", NetInfo observer triggers. | [ ] |
| **TC-NET-03: Network Restoration** | Turn off Airplane mode. | Upload automatically resumes from byte offset without restarting from byte 0. | [ ] |
| **TC-NET-04: Background Navigation** | Start upload and switch to Home or Library tab. | Global Upload Indicator appears floating above tabs; upload continues uninterrupted. | [ ] |
| **TC-NET-05: Cold Restart Recovery** | Force close app at 40% upload; reopen app. | Upload state detected from AsyncStorage; prompts user to resume upload. | [ ] |
| **TC-NET-06: Token Expiry During Upload** | Force session token refresh mid-transfer. | Supabase client refreshes bearer token; PATCH request uses updated JWT seamlessly. | [ ] |
| **TC-NET-07: User Cancel** | Tap cancel button on upload progress bar. | Upload aborts immediately, storage path cleanup triggered, status marked canceled. | [ ] |

---

## 3. Audio Configuration & Job Creation

| Test Case | Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| **TC-CFG-01: Language Choice** | Toggle between English and Hinglish. | Toggle highlights selection, persists choice in AsyncStorage. | [ ] |
| **TC-CFG-02: Depth Estimates** | Switch between Quick (~4m), Standard (~12m), Deep (~25m). | Estimated duration updates dynamically based on document size. | [ ] |
| **TC-CFG-03: Voice Selection** | Select Alloy, Echo, Fable, or Onyx. | Card highlights with neon green glow; voice ID stored. | [ ] |
| **TC-CFG-04: Quota Threshold Check** | Select Deep Dive with only 10 mins left in monthly quota. | Alert appears: *"Quota Warning. This explanation requires ~25 mins..."* with Upgrade link. | [ ] |
| **TC-CFG-05: Double-Submit Prevention** | Rapidly tap "Create Audio Explanation" twice. | Button is disabled immediately on first press; only 1 `create_audio_job` RPC sent. | [ ] |
| **TC-CFG-06: Job Creation Success** | Tap "Create Audio Explanation" after upload finishes. | Calls `create_audio_job`, navigates directly to `/processing/[jobId]`. | [ ] |

---

## 4. Live Processing Screen & State Simulator

| Test Case | Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| **TC-PRC-01: Queued State** | Open `/processing/[jobId]` immediately after creation. | Shows "Waiting in line", thinking mascot, 0% progress. | [ ] |
| **TC-PRC-02: Realtime Progress** | Worker updates progress to 25%, 50%, 75%. | Progress bar animates smoothly; active pipeline step glows with spinner. | [ ] |
| **TC-PRC-03: Dev State Simulator** | In `__DEV__`, tap "Dev: Advance State" pill. | Cycles sequentially through `queued` $\rightarrow$ `extracting` $\rightarrow$ `scripting` $\rightarrow$ `voicing` $\rightarrow$ `assembling` $\rightarrow$ `ready` $\rightarrow$ `failed`. | [ ] |
| **TC-PRC-04: Ready State** | Job reaches status `ready`. | Shows success mascot, 100% progress, all steps checked green, and "Listen to Audio Now" CTA. | [ ] |
| **TC-PRC-05: Cancel Confirmation** | Tap "Cancel" on top bar. | Glass confirmation modal appears: *"Cancel Audio Generation?"* Confirming cancels job. | [ ] |
| **TC-PRC-06: Error Recovery** | Job status becomes `failed`. | Error mascot appears, error message displayed, with "Retry Explanation" and "Pick Another Document" buttons. | [ ] |

---

## 5. Library Management & Document Operations

| Test Case | Steps | Expected Result | Pass/Fail |
| :--- | :--- | :--- | :---: |
| **TC-LIB-01: Upload Status Badges** | Open Library with documents in various states. | Shows appropriate badge: `READY` (green), `UPLOADING` / `QUEUED` (yellow), `FAILED` (red). | [ ] |
| **TC-LIB-02: Rename Title** | Tap 3 dots on card $\rightarrow$ "Rename Title". | Modal opens with current title pre-filled; saving updates title in database and cache. | [ ] |
| **TC-LIB-03: Soft Delete** | Tap 3 dots $\rightarrow$ "Delete Document" $\rightarrow$ Confirm. | Calls `soft_delete_document` RPC; document vanishes from library without hard delete. | [ ] |

