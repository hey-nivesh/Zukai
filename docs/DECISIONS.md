
# Zukai Architectural & Design Decisions Log (DECISIONS.md)

**Phase:** Phase 2 Setup & Foundation  
**Target Platform:** React Native (Expo SDK 58, TypeScript, Android First)

---

## 1. Android Package Name Configuration
- **Specification:** Configured as `com.zukai.app` in `app.json`.
- **Note:** Marked as changeable prior to production store submission if organizational namespace requires adjustment.
- **App Scheme & Name:** Scheme set to `zukai`, Application Display Name set to `Zukai`.

## 2. Mascot Format & Generation Pipeline
- **Specification:** 3D glossy rendered PNG with alpha transparency rather than SVG or Lottie.
- **Resolution Standard:** High-resolution source master saved at 1024x1024 in `src/assets/mascot/source/`, production runtime asset optimized at 512x512 under 250KB in `src/assets/mascot/`.
- **Idle Motion Runtime:** Code-driven continuous float, scale breathing, and neon glow pulsing executed on UI thread via `react-native-reanimated` with `reduced-motion` accessibility checks.
- **Approval Checkpoint:** Base character (`_base.png`) rendered front 3/4 view and halted for user review and approval prior to synthesizing the remaining 8 emotional and functional poses.

## 3. Directory Layout & Routing Structure
- **Expo Router:** Route tree anchored at `app/` (thin routing layer).
- **Core Modules:** Organized in `src/` (`features/`, `components/`, `theme/`, `lib/`, `assets/`, `types/`).
- **Path Aliasing:** Configured `@/*` alias in `tsconfig.json` mapping to `./src/*`.

## 4. Iconography Standard
- **Specification:** Standardized on `lucide-react-native` across all component shells, status badges, and navigation items.

## 5. Storage Architecture for Supabase Auth
- **Constraint:** Supabase auth session payloads often exceed Android `SecureStore` 2048-byte limit.
- **Decision:** Implemented dual-layer storage pattern: AES-256 encryption key stored in `expo-secure-store`, encrypted session payload persisted in `@react-native-async-storage/async-storage`.

## 6. Hardware Blur & Low-End Android Performance Fallback
- **Constraint:** Budget Android chipsets (Snapdragon 680, Helio G-series) drop frames when stacking multiple real-time Gaussian `BlurView` passes with active Skia shaders.
- **Decision:** Built adaptive fallback: when `totalMemory < 4GB`, `GlassCard` and `MeshBackground` substitute real-time blur passes with pre-calculated solid obsidian alpha fills (`rgba(15, 31, 38, 0.92)`) and static linear gradient overlays.


---

## Phase 3 Decisions (Authentication, Sessions, Account Lifecycle)

### 7. Supabase Profiles & Security Definer Trigger
- **Specification:** The `profiles` table is strictly decoupled from client-side inserts/deletions.
- **Decision:** Row creation is automated by a Postgres `after insert` trigger on `auth.users` with `security definer` and `set search_path = ''`. This guarantees that every authenticated user (Email or Google OAuth) has a guaranteed profile without trusting client input.

### 8. Google Play Account Deletion Architecture
- **Specification:** Google Play requires both in-app and web-accessible account deletion with permanent data purging.
- **Decision:** Built a dedicated Supabase Edge Function (`/supabase/functions/delete-account`) using Deno. The client sends its JWT; the server validates caller identity and uses `SUPABASE_SERVICE_ROLE_KEY` to delete `auth.users`, which cascades to delete `public.profiles`. The client requires explicitly typing `DELETE` to prevent accidental loss.

### 9. Multi-State Route Guarding (5-State Machine)
- **Specification:** Guard routes without layout flashing or race conditions between fonts, local storage, and Supabase auth.
- **Decision:** Encapsulated in `AuthProvider` with 5 discrete states: `loading`, `signedOut`, `needsEmailVerification`, `needsOnboarding`, `ready`. Splash screen is kept visible until fonts load AND the initial session check resolves.

### 10. Client-Side Sign-In Throttling
- **Specification:** Protect users from brute-force sign-in lockouts while providing informative UI.
- **Decision:** Implemented client-side attempt tracking in Zustand: 5 consecutive failed attempts trigger an immediate 30-second cooldown timer, preventing excessive server requests while displaying a calm countdown banner.

### 11. Redacting Logger Architecture
- **Specification:** Ensure zero credentials, tokens, or PII ever reach console logs or external telemetry.
- **Decision:** Built `logger` in `src/lib/logger.ts` that automatically redacts JWT tokens (`[REDACTED_JWT]`), emails (`j***@domain.com`), and keys matching password or secret fields before emitting.

---

## Phase 4 Decisions (Full Schema, Multi-Tenancy RLS, Job Queue & Data Layer)

### 12. Tenancy Model Reconciliation (Nullable `org_id` vs Synthetic Personal Orgs)
- **Specification:** Reconcile `DATA_MODEL_DRAFT.md` (which used synthetic 1-user orgs with `is_personal = true`) with Phase 4 system prompt.
- **Decision:** Adopted direct ownership architecture: `owner_id` is mandatory on all tenant-owned tables (`documents`, `audio_jobs`, `audio_tracks`, `usage_events`), while `org_id` is nullable (`null` indicates a personal workspace). This avoids generating millions of synthetic 1-person organizations while maintaining strict isolation: owners always have access to their personal rows, and org members have role-based access to shared rows.

### 13. Isolated Private SQL Schema for RLS Helpers
- **Specification:** Prevent infinite recursion, function tampering, and PostgREST API exposure of RLS evaluation logic.
- **Decision:** Created dedicated schema `private`. Helper functions (`is_org_member`, `org_role`, `can_manage_org`, `can_access_document`, `check_quota`) are declared with `SECURITY DEFINER`, `SET search_path = ''`, and have all privileges revoked from `public`, `anon`, and `authenticated`. Only `postgres` and `service_role` have usage privileges.

### 14. Last Owner Invariant Enforcement Trigger
- **Specification:** Prevent organizations from becoming orphaned without an administrative owner.
- **Decision:** Attached constraint trigger `trg_ensure_last_owner` on `public.memberships`. Deletions or role demotions that reduce owner count to zero are blocked with `P0001 CANNOT_REMOVE_LAST_OWNER`. To permit complete organization deletion, the trigger checks `pg_trigger_depth() > 1`, allowing foreign-key cascading deletes.

### 15. Transactional RPC Job Enqueuing with Client Write Revocation
- **Specification:** Prevent client tampering with audio processing state, costs, and token accounting.
- **Decision:** Revoked direct `INSERT`, `UPDATE`, and `DELETE` on `audio_jobs`, `audio_tracks`, `chapters`, and `transcripts` from `authenticated`. Job creation is atomic via `public.create_audio_job()` RPC, which validates quota, evaluates concurrency limits, inserts the job row, and pushes a task into `pgmq` within a single database transaction.

### 16. Service-Role Worker RPC Separation
- **Specification:** Enable stateless background workers (Fastify AI audio workers in Phase 6) to claim and process jobs without granting blanket database superuser rights.
- **Decision:** Codified worker lifecycle RPCs (`claim_next_job`, `heartbeat_job`, `fail_job`, `complete_job`) requiring `auth.role() = 'service_role'`. The worker uses `FOR UPDATE SKIP LOCKED` to atomically claim jobs and advances exponential backoff retries (up to 3 attempts).

### 17. Dual Billing Period Strategy for Quota Evaluation
- **Specification:** Accurately compute metered audio minute consumption against plan limits across different billing modes.
- **Decision:** Built `private.check_quota` with dual period resolution: Free tier users are metered against calendar month boundaries (`date_trunc('month', now())`), whereas active Pro/Team subscribers are metered against their active RevenueCat `current_period_end` interval.

### 18. Multi-Stage Private Storage Architecture
- **Specification:** Secure document uploads and synthesized audio assets from public exposure and scraping.
- **Decision:** Created three private buckets: `uploads` (250MB limit, TUS resumable uploads), `audio` (100MB limit, service-role write only, 60-min signed URLs for playback), and `avatars` (5MB limit, folder-isolated). Custom storage RLS policies parse object paths to check document and organization membership.

### 19. Selective Realtime Stream Publication
- **Specification:** Allow mobile clients to listen to live job progress without WebSocket overhead or data leakage.
- **Decision:** Added only `public.audio_jobs` to the `supabase_realtime` publication. Documents and transcripts are excluded from Realtime to prevent unencrypted document contents or massive text buffers from broadcasting over public channels.

### 20. Sole Owner Deletion Block in Account Lifecycle
- **Specification:** Avoid silent enterprise data loss when a user requests GDPR or Play Store account deletion.
- **Decision:** Updated the `delete-account` Supabase Edge Function to inspect all organizations where the user is an owner. If the user is the sole owner of any organization, account deletion is blocked with a `SOLE_OWNER_BLOCKED` error instructing them to transfer ownership or delete the organization first.

### 21. Strict Typed Repository Architecture (No Raw Supabase Calls in UI)
- **Specification:** Ensure enterprise code maintainability and decouple React Native presentation components from Supabase SDK queries.
- **Decision:** Created modular API repository modules under `src/features/*/api` (`documentsApi`, `jobsApi`, `tracksApi`, `libraryApi`, `playbackApi`, `usageApi`, `organizationsApi`) backed by TanStack Query hooks. Database types are strictly mapped via `Database` generic with zero `any`.

### 22. `uploading` Document Status & Server-Side Storage Verification (`complete_document_upload` RPC)
- **Specification:** Prevent clients from forging `'uploaded'` or `'ready'` document states without actually providing a verified binary object.
- **Decision:** Added `'uploading'` to the `doc_status` enum. Clients insert rows with status `'uploading'` prior to binary transfer. Status transition to `'uploaded'` is restricted strictly to the `complete_document_upload(document_id)` SECURITY DEFINER RPC. The RPC queries `storage.objects` to ensure the object exists in the `uploads` bucket, matches the user's owner path, and verifies that the recorded size matches within a 2KB margin, preventing unauthorized or empty file claims.

### 23. Stable Storage Path Pre-allocation (`uploads/{owner_id}/{document_id}/original.{ext}`)
- **Specification:** Guarantee deterministic storage keys and prevent path collision or overwrites during uploads.
- **Decision:** Document rows are created first via `createDocumentRow` to allocate a UUID. The storage path is pre-computed as `uploads/{owner_id}/{document_id}/original.{ext}`. This guarantees that file renames, retries, or concurrent uploads from the same user never conflict or corrupt storage blobs.

### 24. TUS Resumable Uploads with Mandatory 6MB Chunk Calibration
- **Specification:** Support large PDF, DOCX, and PPTX file transfers over flaky mobile networks with resume capabilities.
- **Decision:** Integrated `tus-js-client` communicating with the Supabase Storage TUS endpoint. Calibrated `chunkSize` strictly to `6 * 1024 * 1024` (6MB) as enforced by Supabase Storage infrastructure. Employed an exponential backoff retry schedule (`[0, 1000, 3000, 5000, 10000]ms`) for resilient upload transmission.

### 25. Global Zustand Upload Manager Service
- **Specification:** Keep upload transfers alive and observable across navigation tabs and modal transitions without tying execution to an unmounted screen component.
- **Decision:** Designed `uploadManager` as a global Zustand store outside the React component lifecycle. Screens simply subscribe to reactive upload state (`idle`, `preparing`, `uploading`, `paused`, `completing`, `completed`, `failed`, `canceled`), while file transfer runs continuously in background memory.

### 26. Cold-Start Manifest Recovery via AsyncStorage
- **Specification:** Enable recovery and status awareness if the mobile operating system terminates the app process during active uploads.
- **Decision:** The upload manager persists an active upload manifest to AsyncStorage under key `@zukai_active_upload_v1`. On application launch, `checkPendingUpload()` inspects whether an interrupted upload manifest exists, notifying the UI to present a resume or discard banner.

### 27. Network-Aware Auto-Pause and Resume Observer
- **Specification:** Gracefully handle mobile signal drops, tunnel transitions, or WiFi/cellular switches without failing uploads.
- **Decision:** Integrated `@react-native-community/netinfo` event listeners into `uploadManager`. When connectivity drops (`isConnected === false`), the active TUS upload is automatically paused. When network returns, the manager resumes the session from the last acknowledged byte offset.

### 28. Floating Glass Global Upload Indicator Pill
- **Specification:** Keep users informed of document upload and synthesis progress while they browse the library or dashboard.
- **Decision:** Implemented `GlobalUploadIndicator` as an overlay floating above the bottom tab bar. It displays real-time progress percentage, upload transfer speed (KB/s), file title, and quick pause/resume/cancel controls with glassmorphic styling matching design specifications.

### 29. Advisory Client-Side Validation vs Authoritative Server Enforcement
- **Specification:** Provide immediate, responsive feedback to users for invalid files while maintaining bulletproof security on the server.
- **Decision:** Implemented client-side pre-flight checks in `validation.ts` (0-byte rejection, legacy `.doc`/`.ppt` warning, extension vs MIME cross-check, plan file-size limit check, duplicate upload detection). Server-side enforcement in migration `011` and Phase 6 extraction worker validates storage object existence, size parity, and magic byte signatures.

### 30. File Display Title vs Storage Path Decoupling
- **Specification:** Allow users to rename documents and prevent path-traversal or malicious character exploits in storage.
- **Decision:** Sanitized document titles for UI presentation (`sanitizeDocumentTitle` replaces separators, strips extensions, and clamps length to 100 characters), while underlying storage paths strictly adhere to `original.{ext}`. Title edits update the DB record only, requiring zero expensive storage moves or link breaks.

### 31. Android Share Intent Integration Deferred to Follow-up
- **Specification:** Evaluate native Android "Open with Zukai" / Share Sheet intake from external apps (Files, WhatsApp, Google Drive).
- **Decision:** Evaluated Expo SDK 58 share intent plugins. Because third-party share intent packages require custom native Gradle activity modifications that can destabilize Expo managed workflows without development builds, external share intake is cataloged as a post-Phase 6 enhancement. Standard in-app document picking with `expo-document-picker` serves as the primary ingress.

### 32. Expo-AV Audio Engine with Global Zustand Playback Store
- **Specification:** Implement a reliable audio player supporting background playback, lockscreen controls, speed changes, and persistent playback state across tab switches.
- **Decision:** Built `playbackStore` using Zustand powered by `expo-av`. Configured `Audio.setAudioModeAsync` with `staysActiveInBackground: true` and `shouldDuckAndroid: true`. Unifies playback state, audio controls (15s skip, 0.75x–2.0x rates), and periodic throttled sync (every 5 seconds) to `playback_progress` via Supabase RPC.

### 33. Real-Time Sentence-Level Karaoke Transcript Synchronization
- **Specification:** Provide users with an interactive, real-time synchronized transcript that scrolls with speech and allows phrase seeking.
- **Decision:** Transcripts store an array of segments with millisecond start/end boundaries (`start_ms`, `end_ms`). The player engine computes the active sentence dynamically during audio playback updates, highlighting the current sentence with volt-green luminescence and auto-scrolling smoothly. Tapping any sentence triggers an instant seek to that timestamp.

### 34. Persistent Floating Mini-Player Pill (`GlobalMiniPlayer`)
- **Specification:** Allow continuous playback observation and control while users browse library, home, or settings screens.
- **Decision:** Built `GlobalMiniPlayer` as a glassmorphic floating pill anchored above the bottom tab bar. It renders when an active track exists outside `/player`, exposing mini waveform visualization, track title, progress bar, play/pause toggle, and tap-to-expand.

### 35. Fastify Microservice Architecture for Stateless AI Audio Worker
- **Specification:** Isolate heavy document parsing, LLM prompt generation, and audio processing from the frontend HTTP API.
- **Decision:** Created a dedicated TypeScript Node.js Fastify worker in `/worker`. The worker runs a continuous polling loop claiming jobs via `claim_next_job` with `FOR UPDATE SKIP LOCKED`, heartbeating progress at 15%, 45%, 75%, and 90%, and terminating with atomic `complete_job` or exponential backoff `fail_job`.

### 36. Multi-Format Text Extraction with Specialized Error Traps
- **Specification:** Ingest diverse enterprise document formats while handling encrypted, scanned, or empty documents gracefully.
- **Decision:** Implemented extraction router supporting PDF (`pdf-parse`), DOCX (`mammoth`), and plaintext. Explicit error wrappers map parsing failures to user-friendly codes: `PASSWORD_PROTECTED`, `SCANNED_NO_TEXT`, `EMPTY_DOCUMENT`, and `UNSUPPORTED_FORMAT`.

### 37. Gemini Explanation Style Guide & Hinglish Codification
- **Specification:** Ensure AI explanations sound conversational and clear to listeners rather than reading like academic summaries.
- **Decision:** Prompt engineering pipeline strictly implements the *Five Acoustic Clarity Laws* (< 18 words/sentence, anchor analogies, jargon demolition, 10s hook, memory recap). Supports both Spoken English and Romanized Hinglish (standard Latin alphabet with English domain nouns and conversational Hindi phrasing).

### 38. Deterministic Synthesizer Fallback with Standard WAV/PCM Headers
- **Specification:** Enable full end-to-end local development, testing, and CI without hard external Gemini API dependencies.
- **Decision:** `ttsEngine.ts` implements a dual strategy: calls Gemini TTS when API keys are configured, and falls back to a deterministic speech synthesizer that calculates accurate syllable/word timings and generates valid RIFF/WAVE PCM audio files with audible acoustic envelopes.

### 39. Atomic Multi-Resource Completion via `complete_job` RPC
- **Specification:** Avoid orphaned audio tracks, mismatched chapters, or out-of-sync document states on worker crashes.
- **Decision:** Worker bundles all assets (final storage path, duration, bitrate, JSON chapters, JSON transcripts, token counts, compute costs) and passes them to `complete_job` in a single Postgres transaction. This atomically creates `audio_tracks`, `chapters`, `transcripts`, marks `audio_jobs` and `documents` as `ready`, and writes metered `usage_events`.



### 22. `uploading` Document Status & Server-Side Storage Verification (`complete_document_upload` RPC)
- **Specification:** Prevent clients from forging `'uploaded'` or `'ready'` document states without actually providing a verified binary object.
- **Decision:** Added `'uploading'` to the `doc_status` enum. Clients insert rows with status `'uploading'` prior to binary transfer. Status transition to `'uploaded'` is restricted strictly to the `complete_document_upload(document_id)` SECURITY DEFINER RPC. The RPC queries `storage.objects` to ensure the object exists in the `uploads` bucket, matches the user's owner path, and verifies that the recorded size matches within a 2KB margin, preventing unauthorized or empty file claims.

### 23. Stable Storage Path Pre-allocation (`uploads/{owner_id}/{document_id}/original.{ext}`)
- **Specification:** Guarantee deterministic storage keys and prevent path collision or overwrites during uploads.
- **Decision:** Document rows are created first via `createDocumentRow` to allocate a UUID. The storage path is pre-computed as `uploads/{owner_id}/{document_id}/original.{ext}`. This guarantees that file renames, retries, or concurrent uploads from the same user never conflict or corrupt storage blobs.

### 24. TUS Resumable Uploads with Mandatory 6MB Chunk Calibration
- **Specification:** Support large PDF, DOCX, and PPTX file transfers over flaky mobile networks with resume capabilities.
- **Decision:** Integrated `tus-js-client` communicating with the Supabase Storage TUS endpoint. Calibrated `chunkSize` strictly to `6 * 1024 * 1024` (6MB) as enforced by Supabase Storage infrastructure. Employed an exponential backoff retry schedule (`[0, 1000, 3000, 5000, 10000]ms`) for resilient upload transmission.

### 25. Global Zustand Upload Manager Service
- **Specification:** Keep upload transfers alive and observable across navigation tabs and modal transitions without tying execution to an unmounted screen component.
- **Decision:** Designed `uploadManager` as a global Zustand store outside the React component lifecycle. Screens simply subscribe to reactive upload state (`idle`, `preparing`, `uploading`, `paused`, `completing`, `completed`, `failed`, `canceled`), while file transfer runs continuously in background memory.

### 26. Cold-Start Manifest Recovery via AsyncStorage
- **Specification:** Enable recovery and status awareness if the mobile operating system terminates the app process during active uploads.
- **Decision:** The upload manager persists an active upload manifest to AsyncStorage under key `@zukai_active_upload_v1`. On application launch, `checkPendingUpload()` inspects whether an interrupted upload manifest exists, notifying the UI to present a resume or discard banner.

### 27. Network-Aware Auto-Pause and Resume Observer
- **Specification:** Gracefully handle mobile signal drops, tunnel transitions, or WiFi/cellular switches without failing uploads.
- **Decision:** Integrated `@react-native-community/netinfo` event listeners into `uploadManager`. When connectivity drops (`isConnected === false`), the active TUS upload is automatically paused. When network returns, the manager resumes the session from the last acknowledged byte offset.

### 28. Floating Glass Global Upload Indicator Pill
- **Specification:** Keep users informed of document upload and synthesis progress while they browse the library or dashboard.
- **Decision:** Implemented `GlobalUploadIndicator` as an overlay floating above the bottom tab bar. It displays real-time progress percentage, upload transfer speed (KB/s), file title, and quick pause/resume/cancel controls with glassmorphic styling matching design specifications.

### 29. Advisory Client-Side Validation vs Authoritative Server Enforcement
- **Specification:** Provide immediate, responsive feedback to users for invalid files while maintaining bulletproof security on the server.
- **Decision:** Implemented client-side pre-flight checks in `validation.ts` (0-byte rejection, legacy `.doc`/`.ppt` warning, extension vs MIME cross-check, plan file-size limit check, duplicate upload detection). Server-side enforcement in migration `011` and Phase 6 extraction worker validates storage object existence, size parity, and magic byte signatures.

### 30. File Display Title vs Storage Path Decoupling
- **Specification:** Allow users to rename documents and prevent path-traversal or malicious character exploits in storage.
- **Decision:** Sanitized document titles for UI presentation (`sanitizeDocumentTitle` replaces separators, strips extensions, and clamps length to 100 characters), while underlying storage paths strictly adhere to `original.{ext}`. Title edits update the DB record only, requiring zero expensive storage moves or link breaks.

### 31. Android Share Intent Integration Deferred to Follow-up
- **Specification:** Evaluate native Android "Open with Zukai" / Share Sheet intake from external apps (Files, WhatsApp, Google Drive).
- **Decision:** Evaluated Expo SDK 58 share intent plugins. Because third-party share intent packages require custom native Gradle activity modifications that can destabilize Expo managed workflows without development builds, external share intake is cataloged as a post-Phase 6 enhancement. Standard in-app document picking with `expo-document-picker` serves as the primary ingress.

### 32. Expo-AV Audio Engine with Global Zustand Playback Store
- **Specification:** Implement a reliable audio player supporting background playback, lockscreen controls, speed changes, and persistent playback state across tab switches.
- **Decision:** Built `playbackStore` using Zustand powered by `expo-av`. Configured `Audio.setAudioModeAsync` with `staysActiveInBackground: true` and `shouldDuckAndroid: true`. Unifies playback state, audio controls (15s skip, 0.75x–2.0x rates), and periodic throttled sync (every 5 seconds) to `playback_progress` via Supabase RPC.

### 33. Real-Time Sentence-Level Karaoke Transcript Synchronization
- **Specification:** Provide users with an interactive, real-time synchronized transcript that scrolls with speech and allows phrase seeking.
- **Decision:** Transcripts store an array of segments with millisecond start/end boundaries (`start_ms`, `end_ms`). The player engine computes the active sentence dynamically during audio playback updates, highlighting the current sentence with volt-green luminescence and auto-scrolling smoothly. Tapping any sentence triggers an instant seek to that timestamp.

### 34. Persistent Floating Mini-Player Pill (`GlobalMiniPlayer`)
- **Specification:** Allow continuous playback observation and control while users browse library, home, or settings screens.
- **Decision:** Built `GlobalMiniPlayer` as a glassmorphic floating pill anchored above the bottom tab bar. It renders when an active track exists outside `/player`, exposing mini waveform visualization, track title, progress bar, play/pause toggle, and tap-to-expand.

### 35. Fastify Microservice Architecture for Stateless AI Audio Worker
- **Specification:** Isolate heavy document parsing, LLM prompt generation, and audio processing from the frontend HTTP API.
- **Decision:** Created a dedicated TypeScript Node.js Fastify worker in `/worker`. The worker runs a continuous polling loop claiming jobs via `claim_next_job` with `FOR UPDATE SKIP LOCKED`, heartbeating progress at 15%, 45%, 75%, and 90%, and terminating with atomic `complete_job` or exponential backoff `fail_job`.

### 36. Multi-Format Text Extraction with Specialized Error Traps
- **Specification:** Ingest diverse enterprise document formats while handling encrypted, scanned, or empty documents gracefully.
- **Decision:** Implemented extraction router supporting PDF (`pdf-parse`), DOCX (`mammoth`), and plaintext. Explicit error wrappers map parsing failures to user-friendly codes: `PASSWORD_PROTECTED`, `SCANNED_NO_TEXT`, `EMPTY_DOCUMENT`, and `UNSUPPORTED_FORMAT`.

### 37. Gemini Explanation Style Guide & Hinglish Codification
- **Specification:** Ensure AI explanations sound conversational and clear to listeners rather than reading like academic summaries.
- **Decision:** Prompt engineering pipeline strictly implements the *Five Acoustic Clarity Laws* (< 18 words/sentence, anchor analogies, jargon demolition, 10s hook, memory recap). Supports both Spoken English and Romanized Hinglish (standard Latin alphabet with English domain nouns and conversational Hindi phrasing).

### 38. Deterministic Synthesizer Fallback with Standard WAV/PCM Headers
- **Specification:** Enable full end-to-end local development, testing, and CI without hard external Gemini API dependencies.
- **Decision:** `ttsEngine.ts` implements a dual strategy: calls Gemini TTS when API keys are configured, and falls back to a deterministic speech synthesizer that calculates accurate syllable/word timings and generates valid RIFF/WAVE PCM audio files with audible acoustic envelopes.

### 39. Atomic Multi-Resource Completion via `complete_job` RPC
- **Specification:** Avoid orphaned audio tracks, mismatched chapters, or out-of-sync document states on worker crashes.
- **Decision:** Worker bundles all assets (final storage path, duration, bitrate, JSON chapters, JSON transcripts, token counts, compute costs) and passes them to `complete_job` in a single Postgres transaction. This atomically creates `audio_tracks`, `chapters`, `transcripts`, marks `audio_jobs` and `documents` as `ready`, and writes metered `usage_events`.


### 40. Dev/Offline Auth Bypass Pattern & 3D Glassmorphic UI Overhaul
- **Specification:** Enable testing end-to-end user onboarding, sign-up, sign-in, language selection, and home dashboard navigation even when Supabase is offline or in development environments without local Docker running. Integrate official cybernetic brand logo and establish generous spacing and 3D depth across all auth and onboarding surfaces.
- **Decision:**
  1. `authStore.ts` implements an automatic offline/dev session fallback: when network errors occur or `demo`/`test` accounts are used, an active user session and profile are persisted to `@zukai_dev_session` in `AsyncStorage`. Both `updateLanguage` and `completeOnboarding` sync to this local store.
  2. Applied the official Zukai cybernetic neon robot 'Z' logo across `src/assets/brand/logo.png`, `src/assets/brand/icon.png`, `assets/images/icon.png`, `assets/images/splash-icon.png`, and `assets/images/adaptive-icon.png`. Enhanced `BrandLogo` with orientation support (`row` | `column`) and radial neon halo.
  3. Upgraded `GlassCard` and `MeshBackground` with 3D multi-stop bevel rim gradients, atmospheric lighting (volt green `#92F702`, cyan `#00B0FF`), layered drop shadows, and high-contrast typography. Redesigned `sign-in.tsx`, `sign-up.tsx`, and `onboarding.tsx` with uppercase section labels, 56px input heights, active volt focus glows, and 20px+ inter-field breathing space.

### 41. Safe Google Sign-In Native Check & Development Fallback
- **Specification:** Prevent `TurboModuleRegistry.getEnforcing: 'RNGoogleSignin' could not be found` invariant violation in Expo Go while keeping production Google OAuth readiness.
- **Decision:**
  1. Guarded native module resolution using `TurboModuleRegistry.get('RNGoogleSignin')` and `NativeModules.RNGoogleSignin` instead of dynamic `require` at runtime.
  2. When running in Expo Go or environments without native Google Sign-In binaries, `authStore.ts` provides a simulated developer Google session (`alex.google@zukai.app`), allowing full end-to-end testing of authenticated flows.
  3. Fixed `logger.ts` object sanitizer to preserve `name`, `message`, and `stack` properties on `Error` instances instead of serializing to empty objects `{}`.

### 42. PostgreSQL 55P04 Enum Value Lifecycle & Partial Index Immutability
- **Specification:** Resolve `ERROR 55P04 (unsafe use of new value "uploading" of enum type doc_status)` and `ERROR 42P17 (functions in index predicate must be marked IMMUTABLE)` when executing Supabase migrations.
- **Decision:**
  1. Updated `20261107000002_schema_and_enums.sql` so `public.doc_status` enum includes `'uploading'` (`'uploading', 'uploaded', 'ready', 'failed', 'deleted'`) from the initial schema definition.
  2. For databases where `doc_status` was already initialized, partitioned migration 011 execution into a committed `ALTER TYPE` step prior to altering table defaults or compiling plpgsql routines that reference the new enum value.
  3. Replaced `where (accepted_at is null and expires_at > now())` with `where (accepted_at is null)` on `idx_invitations_unique_pending` in migration 003, removing non-immutable `now()` from index predicates.
