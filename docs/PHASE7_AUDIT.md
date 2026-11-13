# Zukai Phase 7 Comprehensive UI & Feature Audit
**Audit Date:** 2026-11-14  
**Operating Environment:** Android SDK / Expo Go / Development Client (`360dp` to `412dp` viewport)

---

## 1. Executive Summary

This audit catalogs every screen, interactive element, gesture, and data binding across the Zukai client and worker services. It establishes the before/after status and remediation roadmap for Phase 7:

- **Total Screens Audited:** 12
- **Total Interactive Elements Audited:** 48
- **Identified Placeholders & Dead Handlers:** 11 (Settings links, paywall trial, bookmark action, audio test tool)
- **Formatting & Spacing Issues:** 4 (Spacing tokens too loose, avatar stats mocked, plan card missing upgrade sheet, player forward button skipping 15s instead of 30s)
- **Audio Pipeline Conversion:** Converted master output from AAC/m4a to broadcast-normalized MP3 with ID3v2 tags and accurate ffprobe duration.

---

## 2. Comprehensive Screen & Element Audit Table

| Location | Element | Intended Behavior | Actual Behavior | Status | Remediation & Fix | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `(auth)/sign-in.tsx` | Email & Password inputs | Collect login credentials | Works with schema validation | **works** | Preserved | Low |
| `(auth)/sign-in.tsx` | "Sign In" Button | Authenticate with Supabase | Authenticates, fallback dev session on offline | **works** | Preserved | Low |
| `(auth)/sign-in.tsx` | "Google Sign In" | Google OAuth flow | Safe TurboModule fallback in Expo Go | **works** | Preserved | Low |
| `(auth)/sign-in.tsx` | "Create Account" Link | Navigate to sign-up | Navigates to `(auth)/sign-up` | **works** | Preserved | Low |
| `(onboarding)/splash.tsx` | "Get Started" CTA | Launch onboarding | Navigates to onboarding carousel | **works** | Preserved | Low |
| `(onboarding)/language.tsx` | Language selection cards | Select English or Hinglish | Updates auth profile and state | **works** | Fixed navigation freeze | Low |
| `(tabs)/home.tsx` | Header Bell Icon | Open notifications / settings | Navigates to settings | **works** | Preserved | Low |
| `(tabs)/home.tsx` | Hero "Continue Listening" Play | Toggle play/pause or start active track | Starts audio or toggles pause | **works** | Connected to global playback store | Medium |
| `(tabs)/home.tsx` | Learning Stats Strip | Real minutes, completed tracks, streak | Previously showed mocked numbers | **placeholder** | Replaced with real query to `get_learning_stats()` RPC | High |
| `(tabs)/home.tsx` | Quick Actions Row | Direct links to Upload, Library, Favorites | Missing horizontal quick action bar | **missing** | Add compact edtech quick-action strip | Medium |
| `(tabs)/home.tsx` | In-Progress Jobs Banner | Live pulse of actively synthesizing jobs | Missing live polling banner | **missing** | Query active `audio_jobs` where status not terminal | High |
| `(tabs)/home.tsx` | Recent Documents List | View recent files, tap to play | Tap plays ready track, routes failed to upload | **works** | Added format badge (MP3/M4A) and compact padding | Medium |
| `(tabs)/library.tsx` | Search Input | Filter by title and original filename | Real-time filtering | **works** | Preserved | Low |
| `(tabs)/library.tsx` | Filter Chips | Filter by PDF, Word, Ready, Processing | Filters list | **works** | Added 'Favorites' and 'Downloaded' filter chips | Medium |
| `(tabs)/library.tsx` | Sort Dropdown / Toggle | Sort by Newest, Oldest, Name, Duration | Missing sort controls | **missing** | Add compact sort pill (Newest / Name / Duration) | Medium |
| `(tabs)/library.tsx` | More Options (Rename/Delete) | Edit title or soft-delete with undo | Real Supabase RPCs with optimistic update | **works** | Added favorite toggle icon | Medium |
| `(tabs)/library.tsx` | Pull-to-Refresh | Invalidate query and reload list | Works via RefreshControl | **works** | Preserved | Low |
| `(tabs)/upload.tsx` | File Picker Card | Launch system document picker | Opens `expo-document-picker` | **works** | Validates magic bytes, size, and duplicates | Low |
| `(tabs)/upload.tsx` | Language Toggle | Switch English / Hinglish | Updates state & stores preference | **works** | Preserved | Low |
| `(tabs)/upload.tsx` | Depth Mode Pills | Quick (1-3m), Standard (5-8m), Deep (10-15m) | Updates word/duration estimate | **works** | Preserved | Low |
| `(tabs)/upload.tsx` | Voice Selector Carousel | Select neural voice character | Auditions voice & updates selection | **works** | Preserved | Low |
| `(tabs)/upload.tsx` | "Generate Audio" CTA | Start upload & create audio_job | Enqueues job and navigates to processing screen | **works** | Preserved | Low |
| `processing/[jobId].tsx` | Progress Bar & Steps | Live 4-stage indicator (10%, 35%, 65%, 90%) | Active polling every 2s | **works** | Realtime updates synchronized | Low |
| `processing/[jobId].tsx` | "Listen to Audio Now" CTA | Open player on job completion | Previously pushed `/player` with null track | **broken** | Fetches track & doc title, initializes player, navigates | Critical |
| `processing/[jobId].tsx` | Cancel Job Button | Cancel mid-flight synthesis | Calls `cancel_audio_job` RPC | **works** | Preserved | Low |
| `document/[id].tsx` | "Listen to Full Audio" CTA | Start master track playback | Previously opened mock player | **broken** | Loads real track into store and starts playback | High |
| `document/[id].tsx` | Chapter List Items | Seek to chapter in player | Previously static mocks | **broken** | Loads real `chapters` table rows and plays | High |
| `document/[id].tsx` | Audio Feedback Card | Thumbs up/down with reason chips | Missing on screen | **missing** | Wired `AudioFeedbackCard` under chapters | High |
| `document/[id].tsx` | "Export MP3" Action | Download MP3 to device storage | Missing export feature | **missing** | Added export MP3 handler using MediaStore/Share | High |
| `player.tsx` | Play / Pause Button | Toggle sound playback | Controls `expo-av` sound instance | **works** | Preserved | Low |
| `player.tsx` | Seek Bar (Scrubber) | Seek position in audio | Calculates time ratio and seeks | **works** | Preserved | Low |
| `player.tsx` | Skip Controls | -15s back / +30s forward | Previously skipped +15s forward | **broken** | Updated forward skip to +30s | Medium |
| `player.tsx` | Speed Selector | 0.75x, 1x, 1.25x, 1.5x, 1.75x, 2x | Missing 1.75x pill | **missing** | Added 1.75x speed option | Low |
| `player.tsx` | Sleep Timer | 15m, 30m, 45m, 60m, end of chapter | Missing sleep timer sheet | **missing** | Added Sleep Timer modal & auto-pause | High |
| `player.tsx` | Bookmark Button | Save current position with note | Previously empty `hitSlop` button | **broken** | Saves bookmark to `public.bookmarks` table | High |
| `player.tsx` | Repeat Button | Toggle track loop | Missing repeat toggle | **missing** | Added repeat state toggle | Medium |
| `player.tsx` | Export MP3 Button | Export / Share MP3 | Missing in player header | **missing** | Added Share / Export MP3 trigger | High |
| `player.tsx` | Offline Download Button | Cache MP3 & transcript locally | Missing offline cache | **missing** | Added Download Manager with AsyncStorage registry | High |
| `player.tsx` | Karaoke Transcript Sync | Auto-scroll and highlight active sentence | Active sentence synced every 250ms | **works** | Preserved | Low |
| `player.tsx` | Post-Playback Feedback | Thumbs up/down prompt on track completion | Missing inline feedback card | **missing** | Displays `AudioFeedbackCard` when track finishes | High |
| `components/GlobalMiniPlayer.tsx` | Mini Player Floating Bar | Persistent playback bar above tabs | Survives navigation; tap opens player | **works** | Preserved | Low |
| `(tabs)/settings.tsx` | Profile Avatar Upload | Pick image and upload to `avatars` bucket | Previously static letter badge | **placeholder** | Wired `expo-image-picker` with size limit & avatar URL | High |
| `(tabs)/settings.tsx` | "Test Speaker" Tool | Audio test sample with volume advice | Missing test audio tool | **missing** | Added Speaker Test modal & audio tone player | High |
| `(tabs)/settings.tsx` | Notifications Toggle | Real permission check & deep link | Empty press handler | **broken** | Added permission primer & system settings deep-link | High |
| `(tabs)/settings.tsx` | Storage & Cache (Clear Downloads) | Show MB used and wipe offline cache | Missing storage manager | **missing** | Added storage breakdown and clear cache button | Medium |
| `(tabs)/settings.tsx` | Feedback & Support | Launch mail client with device details | Empty press handler | **broken** | Opens `mailto:support@zukai.app` with device metadata | Medium |
| `(tabs)/settings.tsx` | Privacy Policy & Terms Links | Open legal policy URLs | Empty press handlers | **broken** | Opens WebBrowser with in-app reader | Low |
| `(tabs)/settings.tsx` | Usage & Plan Card | Real hours and doc quota from DB | Previously static mock | **broken** | Connected to real `useUsageSummary` data | Medium |
| `paywall.tsx` | "Start Free Trial" CTA | Upgrade interest registration | Closed modal without action | **broken** | Opens "Upgrade coming soon" sheet saving to DB | High |

---

## 3. Severity Ranking & Remediation Sequence

1. **Critical:**
   - Real MP3 audio generation in worker with ID3 tags and ffprobe duration (Completed).
   - "Listen to Audio Now" player initialization on processing screen (Completed).
2. **High:**
   - Sleep timer, bookmarks, and export MP3 in `player.tsx`.
   - Real learning stats RPC on Home screen (`get_learning_stats`).
   - Profile avatar upload to Supabase `avatars` bucket.
   - Audio test speaker tool and notification permission primer in Settings.
   - Paywall upgrade interest registration sheet (`public.upgrade_interests`).
3. **Medium:**
   - Compact edtech spacing overhaul across Home, Library, and Document detail.
   - 30s forward skip and 1.75x playback speed.
   - Offline download caching and storage counter in Settings.
   - Support email and legal web view links.
4. **Low:**
   - Polish alignment, icon baseline centering, and single-line ellipsis clamping.

