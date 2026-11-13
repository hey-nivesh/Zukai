# Phase 7 QA Checklist

> **Status:** In progress — TypeScript ✅ | Tests 51/51 ✅ | Manual device testing required

---

## 1. Build Verification

| Check | Command | Expected | Status |
|-------|---------|----------|--------|
| TS typecheck (app) | `cd zukai && npx tsc --noEmit` | No errors | ✅ 0 errors |
| App Jest suite | `cd zukai && npm test` | 51/51 pass | ✅ 51/51 |
| Worker build | `cd worker && npm run build` | No errors | ✅ |
| Worker Jest suite | `cd worker && npm test` | 13/13 pass | ✅ 13/13 |
| ffprobe on sample.mp3 | `ffprobe worker/samples/sample.mp3` | mp3 codec, 24 kHz, mono, 96 kbps | ✅ |

---

## 2. Auth & Onboarding

| Screen | Test | Expected | Device Result |
|--------|------|----------|---------------|
| Splash | Launch cold | Splash → Onboarding in < 1s | ☐ |
| Onboarding | Swipe through 3 cards | Smooth, no jank | ☐ |
| Language select | Tap English / Hinglish | Selection persists | ☐ |
| Sign Up | Valid email + strong password | Account created, email verify screen | ☐ |
| Sign In | Valid credentials | Navigates to Home | ☐ |
| Sign In | Wrong password | Error toast, not crash | ☐ |
| Forgot password | Enter email | Supabase email sent | ☐ |
| Deep link | Open reset link | Reset password screen | ☐ |

---

## 3. Home Screen

| Element | Expected | Device Result |
|---------|----------|---------------|
| Welcome greeting | Shows first name from profile | ☐ |
| Stats strip | Live docs count + minutes (via RPC) | ☐ |
| Quick actions row | Upload / Library / Downloads / Favorites chips visible | ☐ |
| Quick action — Upload | Navigates to Upload tab | ☐ |
| Quick action — Library | Navigates to Library tab | ☐ |
| Quick action — Downloads | Shows alert with guidance | ☐ |
| Quick action — Favorites | Shows alert with guidance | ☐ |
| Active jobs banner | Shows when jobs processing, hides when none | ☐ |
| Active jobs banner tap | Navigates to processing/[jobId] | ☐ |
| Hero card — ready doc | Shows with green accent, play button | ☐ |
| Hero card play button | Starts audio, navigates to player | ☐ |
| Recent docs list | Shows all documents with status chips | ☐ |
| Empty state | Shows mascot + "Upload Document" button when no docs | ☐ |
| Compact padding | H-pad 16, card-pad 12, item-gap 8 | ☐ |

---

## 4. Upload Screen

| Element | Expected | Device Result |
|---------|----------|---------------|
| File picker | Opens native picker for PDF/DOCX | ☐ |
| Invalid file type | Error toast shown | ☐ |
| File too large | Quota error shown | ☐ |
| Language toggle | English ↔ Hinglish | ☐ |
| Depth mode | Quick / Standard / Deep — changes duration estimate | ☐ |
| Voice picker | Shows available TTS voices | ☐ |
| Upload progress | Shows % while uploading to Supabase storage | ☐ |
| Start generation | Navigates to processing/[jobId] | ☐ |
| Unauthorized error | Sign in prompt shown | ☐ |

---

## 5. Processing Screen

| Element | Expected | Device Result |
|---------|----------|---------------|
| Job status | Polls every 2s, shows extracting → scripting → voicing → assembling → ready | ☐ |
| Progress animation | Pulsing/step animation visible during processing | ☐ |
| "Listen Now" button | Only appears when status=ready; starts audio + goes to player | ☐ |
| Failed state | Shows error message + retry/delete options | ☐ |
| Cancel button | Cancels job, returns to Library | ☐ |

---

## 6. Player Screen

| Element | Expected | Device Result |
|---------|----------|---------------|
| Audio plays | MP3 audio plays correctly from Supabase signed URL | ☐ |
| Offline fallback | Plays from local cache if downloaded | ☐ |
| Play/Pause | Toggles correctly | ☐ |
| Skip back 15s | Seeks back 15 seconds | ☐ |
| Skip forward 30s | Seeks forward 30 seconds | ☐ |
| Speed picker | 0.75 / 1.0 / 1.25 / 1.5 / 1.75 / 2.0 — rate changes audibly | ☐ |
| Repeat toggle | On: audio loops; Off: stops at end | ☐ |
| Sleep timer | Opens modal; 15/30/45/60 min; countdown shown in header | ☐ |
| Bookmark | Saves bookmark to Supabase; toast shown | ☐ |
| Download | Downloads MP3 to local storage; icon changes to ✓ | ☐ |
| Delete download | Removes local file; icon reverts | ☐ |
| Share | Opens system share sheet with signed URL | ☐ |
| CHAPTERS tab | Lists chapters with timestamps; tap seeks to chapter | ☐ |
| TRANSCRIPT tab | Shows full transcript text, highlights current segment | ☐ |
| Feedback card | Appears at ≥ 95% completion; can rate + submit | ☐ |
| Notification primer | Appears first time player opens; allows/dismisses | ☐ |
| Mini player | Visible on other tabs while playing | ☐ |
| Mini player tap | Returns to player screen | ☐ |

---

## 7. Library Screen

| Element | Expected | Device Result |
|---------|----------|---------------|
| Document list | Shows all non-deleted docs with status | ☐ |
| Search bar | Filters by title live | ☐ |
| Sort pills | Newest / Oldest / Name / Duration — sorts list | ☐ |
| Favorites filter | Shows only favorited docs | ☐ |
| Downloaded filter | Shows only locally cached docs | ☐ |
| Star icon on row | Toggles favorite; updates Supabase | ☐ |
| Compact rows | Min height 56dp; title 1 line truncated | ☐ |
| Tap row | Navigates to document/[id] | ☐ |
| Swipe or long press | (Optional) delete shortcut | ☐ |

---

## 8. Document Detail Screen

| Element | Expected | Device Result |
|---------|----------|---------------|
| Metadata grid | Pages, duration, language, status — live from DB | ☐ |
| "Listen to Full Audio" | Starts audio + navigates to player | ☐ |
| Chapters list | Shows all chapters with duration | ☐ |
| Chapter tap | Seeks player to chapter start | ☐ |
| Share Audio | Opens system share sheet with signed audio URL | ☐ |
| Delete | Confirmation alert; deletes + returns to library | ☐ |
| Feedback card | Thumbs up/down + reasons + submit | ☐ |

---

## 9. Settings Screen

| Element | Expected | Device Result |
|---------|----------|---------------|
| Profile card | Shows name, email, plan tier, live usage stats | ☐ |
| Edit name | Modal; saves to Supabase; updates UI | ☐ |
| Language | Modal; English / Hinglish; persists | ☐ |
| Notifications row | Shows current permission; requests on tap | ☐ |
| Storage & Cache | Shows downloaded MB; tap to clear | ☐ |
| Feedback & Support | Opens mailto: in email client | ☐ |
| Privacy Policy | Opens browser with privacy URL | ☐ |
| Terms of Use | Opens browser with terms URL | ☐ |
| App Version | Shows `v1.0.0` from expo-constants | ☐ |
| Sign Out | Clears session; returns to sign-in | ☐ |
| Delete Account | Confirmation modal with "DELETE" text required | ☐ |

---

## 10. Paywall Screen

| Element | Expected | Device Result |
|---------|----------|---------------|
| Feature list | 4 pro features listed | ☐ |
| Monthly / Yearly toggle | Price label changes | ☐ |
| Start Free Trial button | Inserts row to `upgrade_interests`; shows waitlist alert | ☐ |
| Close button | Returns to previous screen | ☐ |

---

## 11. MP3 Audio Pipeline (Worker)

| Check | Command | Expected | Status |
|-------|---------|----------|--------|
| Sample MP3 exists | `ls worker/samples/sample.mp3` | ≥ 400 KB | ✅ 457 KB |
| ffprobe codec | `ffprobe worker/samples/sample.mp3` | codec=mp3 | ✅ |
| ffprobe sample rate | | 24000 Hz | ✅ |
| ffprobe channels | | mono (1) | ✅ |
| ffprobe bitrate | | 96 kb/s | ✅ |
| ID3 title tag | | "Distributed Systems Explained" | ✅ |
| ID3 artist tag | | "Zukai" | ✅ |
| ID3 album tag | | "Zukai Audio Explanations" | ✅ |
| ID3 language tag | | "english" | ✅ |
| Duration from ffprobe | | 38 s (not estimated) | ✅ |

---

## 12. Migrations

| Migration | Purpose | Applied to Supabase? |
|-----------|---------|----------------------|
| 20261107000012 | audio_feedback table, quality_meta column | ⚠️ Manual — apply via dashboard |
| 20261107000013 | bookmarks, document_favorites, upgrade_interests, get_learning_stats() | ⚠️ Manual — apply via dashboard |

---

## 13. Maestro E2E Tests

> Located in `.maestro/` — requires Maestro CLI + Android emulator with dev build

| Flow | File | Status |
|------|------|--------|
| Onboarding | 01_onboarding.yaml | ☐ Ready |
| Sign In | 02_sign_in.yaml | ☐ Ready |
| Upload | 03_upload.yaml | ☐ Ready |
| Player | 04_player.yaml | ☐ Ready |
| Settings | 05_settings.yaml | ☐ Ready |

---

## 14. Performance Targets

| Metric | Target | Measured |
|--------|--------|---------|
| Cold start (splash → home) | < 2s | ☐ |
| Library scroll FPS | ≥ 58 fps | ☐ |
| Upload screen render | < 300ms | ☐ |
| Audio playback latency | < 200ms after tap | ☐ |
| Memory during playback | < 150 MB RSS | ☐ |
| JS bundle size | < 5 MB | ☐ |

---

## 15. Accessibility & Responsive

| Check | Expected | Status |
|-------|----------|--------|
| All tap targets ≥ 48dp | Pressable min-height 48 | ☐ |
| Font scale 1.3 | No text clipped or overlapping | ☐ |
| 360dp width | No horizontal overflow | ☐ |
| 412dp width (Pixel 7) | Comfortable layout | ☐ |
| Screen reader | Key elements have accessibilityLabel | ☐ |

