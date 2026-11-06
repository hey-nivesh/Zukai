# Zukai — User Flows and Screen Inventory
**Document Version:** 1.0.0  
**Scope:** End-to-End User Experience, Navigation Architecture, and Screen Specifications

---

## 1. Core User Flows (Mermaid Diagrams)

### Flow 1: First Launch & Interactive Onboarding

```mermaid
flowchart TD
    AppLaunch[User Launches Zukai] --> Splash[Animated Splash Screen<br/>Logo Visor Glow]
    Splash --> CheckAuth{Auth Token Exists?}
    
    CheckAuth -- Yes --> Home[Dashboard / Home Feed]
    CheckAuth -- No --> OnboardingCarousel[3-Slide Onboarding Carousel]
    
    OnboardingCarousel --> Slide1["Slide 1: Turn Dense Docs into Audio<br/>Mascot: Zuke-Welcome"]
    Slide1 --> Slide2["Slide 2: Understand in English or Hinglish<br/>Mascot: Zuke-Listening"]
    Slide2 --> Slide3["Slide 3: Save Hours Every Week<br/>Mascot: Zuke-Success"]
    Slide3 --> AuthScreen[Auth Choice: Sign In / Create Account]
```

---

### Flow 2: Sign Up & Authentication

```mermaid
flowchart TD
    AuthScreen --> ChooseProvider{Select Auth Method}
    ChooseProvider -->|Google OAuth| GoogleAuth[Google Sign-In Native Flow]
    ChooseProvider -->|Magic Link / OTP| EmailInput[Enter Email Address]
    
    EmailInput --> SendOTP[Supabase Auth sends 6-Digit OTP]
    SendOTP --> VerifyOTP[Enter Verification Code]
    
    GoogleAuth --> AuthSuccess{Auth Verified?}
    VerifyOTP --> AuthSuccess
    
    AuthSuccess -- Yes --> InitProfile[Initialize Profile & Default Org]
    InitProfile --> LangChoice[Select Preferred Language: English or Hinglish]
    LangChoice --> Home
    AuthSuccess -- No --> AuthError[Error Toast & Retry Option]
```

---

### Flow 3: Upload to Audio Processing Pipeline

```mermaid
flowchart TD
    Home --> TapFAB[Tap Floating Action Button '+']
    TapFAB --> UploadModal[Upload Sheet: File Picker]
    UploadModal --> SelectFile[Select .pdf, .docx, .pptx, .txt]
    
    SelectFile --> ClientValidate{Format & Size Valid?}
    ClientValidate -- No --> ValidationError[Show Warning Toast: Exceeds Quotas]
    ClientValidate -- Yes --> ConfigScreen[Configure Audio Screen]
    
    ConfigScreen --> ChooseDepth[Select Depth: Quick / Standard / Deep Dive]
    ConfigScreen --> ChooseLanguage[Select Language: English / Hinglish]
    ConfigScreen --> ConfirmJob[Tap 'Generate Audio' Button with Gloss Shine]
    
    ConfirmJob --> DirectUpload[Upload File to Supabase Storage Bucket]
    DirectUpload --> CreateJob[Insert record into audio_jobs table]
    CreateJob --> ProcessingView[Processing Screen: Mascot Zuke-Thinking]
    
    ProcessingView --> SupabaseRealtime[Supabase Realtime Channel: Listen for Job Status]
    SupabaseRealtime -->|Event: COMPLETED| AudioReadyNotification[Haptic Pulse & Audio Ready]
    AudioReadyNotification --> AutoPlayChoice{Open Player Immediately?}
    AutoPlayChoice -- Yes --> AudioPlayer[Full-Screen Audio Player]
    AutoPlayChoice -- No --> Library[Saved in Library]
    
    SupabaseRealtime -->|Event: FAILED| ErrorState[Error Screen: Mascot Zuke-Error]
```

---

### Flow 4: Listening Experience & Real-time Transcript

```mermaid
flowchart TD
    Library --> TapTrack[Tap Track Card]
    TapTrack --> AudioPlayer[Open Full-Screen Player]
    
    AudioPlayer --> PlayerControls[Play / Pause / Seek / Speed 0.75x-2.5x]
    AudioPlayer --> LockscreenControls[Android Media Notification & Lockscreen Scrubber]
    AudioPlayer --> ViewSelector{View Mode}
    
    ViewSelector --> VisualWaveform[Equalizer & Waveform Bar View]
    ViewSelector --> LiveTranscript[Synchronized Karaoke Transcript View]
    
    LiveTranscript --> TapSentence[Tap Any Sentence in Transcript]
    TapSentence --> SeekAudio[Audio Jumps to Sentence Timestamp]
    
    PlayerControls --> UpdateProgress[Throttle Save Progress to DB every 5s]
    PlayerControls --> FinishTrack{Track Complete?}
    FinishTrack -- Yes --> CompletionDialog[Mascot Zuke-Success: Mark Complete & Suggest Next]
```

---

### Flow 5: Library Management & Search

```mermaid
flowchart TD
    Home --> BottomTabLibrary[Tap 'Library' Tab]
    BottomTabLibrary --> LibraryView[Library Screen: List / Grid Toggle]
    
    LibraryView --> FilterChips[Filter: All / Quick Summaries / Deep Dives / Unheard]
    LibraryView --> SearchBar[Type Search Query: Searches Titles & Transcripts]
    
    LibraryView --> TrackItem[Long-press or Swipe on Track]
    TrackItem --> ActionMenu[Action Sheet: Share, Delete, Reprocess, Download]
    
    ActionMenu -->|Delete| ConfirmDelete[Confirm Deletion & Purge Audio]
    ActionMenu -->|Reprocess| ConfigScreen[Open Config Screen with Alternate Settings]
```

---

### Flow 6: Subscription & Paywall Upgrade

```mermaid
flowchart TD
    UserAction[User hits Tier Gate: e.g. Deep Dive or Monthly Limit] --> PaywallModal[Open Glassmorphism Paywall Modal<br/>Mascot: Zuke-Paywall]
    
    PaywallModal --> SelectBilling{Choose Billing Cycle}
    SelectBilling --> AnnualSub[Annual Plan: Save 35% + 7-Day Free Trial]
    SelectBilling --> MonthlySub[Monthly Plan: Billed Monthly]
    
    AnnualSub --> TapPay[Tap 'Unlock Zukai Pro' Button with Sweep Shimmer]
    MonthlySub --> TapPay
    
    TapPay --> RevenueCatPay[Trigger Google Play In-App Purchase Flow]
    RevenueCatPay --> PlayStoreModal[Google Play Payment Sheet]
    
    PlayStoreModal --> PurchaseSuccess{Purchase Successful?}
    PurchaseSuccess -- Yes --> SyncEntitlements[RevenueCat Webhook updates subscriptions table]
    SyncEntitlements --> ConfettiModal[Pro Badge Activated & Quota Unlocked]
    ConfettiModal --> ResumeAction[Resume Original User Action]
    
    PurchaseSuccess -- No --> CancelNotice[Dismiss Sheet, Keep on Free Tier]
```

---

### Flow 7: Team Organization & Member Invitation

```mermaid
flowchart TD
    Settings --> TapOrg[Tap 'Organization & Workspace' Settings]
    TapOrg --> OrgDashboard[Org Management Screen]
    
    OrgDashboard --> InviteButton[Tap 'Invite Member' Button]
    InviteButton --> InviteModal[Enter Teammate Email & Select Role: Admin/Member]
    InviteModal --> SendInvite[Supabase Edge Function creates Invitation & Sends Email]
    
    SendInvite --> RecipientEmail[Recipient receives Email with Magic Deep Link]
    RecipientEmail --> ClickLink[Open Zukai App via Deep Link: zukai://invite?token=xyz]
    
    ClickLink --> ValidateInvite{Invite Valid & Active?}
    ValidateInvite -- Yes --> JoinOrg[User added to memberships table for Org]
    JoinOrg --> SwitchOrgToast[Toast: Switched to Organization Workspace]
    SwitchOrgToast --> Home
    ValidateInvite -- No --> ExpiredToast[Error: Link Expired or Already Used]
```

---

## 2. Complete Screen Inventory

| Screen Route | Screen Name | Purpose & Functional Highlights | Mascot State |
| :--- | :--- | :--- | :--- |
| `/splash` | **Splash Screen** | Animated cold boot screen. Neon visor glow animation. Checks session auth and directs to `/onboarding` or `/(tabs)/home`. | Logo Visor Pulse |
| `/onboarding` | **Onboarding Carousel** | 3-slide value-prop tour explaining document listening, English/Hinglish synthesis, and time savings. | `Zuke-Welcome`, `Zuke-Listening`, `Zuke-Success` |
| `/(auth)/sign-in` | **Authentication Screen** | One-tap Google Sign-In and Email OTP login. Glassmorphic card over dark radial gradient. | `Zuke-Welcome` |
| `/(tabs)/home` | **Dashboard / Home** | Daily summary, quick stats (minutes listened, time saved), currently processing banner, "Continue Listening" hero card, and recent documents. | `Zuke-Listening` (Mini Badge) |
| `/(tabs)/library` | **Library & Archives** | Searchable repository of all processed documents, audio tracks, and playlists. Filterable by language, depth, and read status. | `Zuke-Empty` (when 0 tracks) |
| `/(tabs)/team` | **Team Workspace** | Enterprise organization feed. Shows team-shared documents, leaderboards, departmental playlists, and member activity. | `Zuke-Welcome` |
| `/(tabs)/settings` | **Settings & Preferences**| Account management, default audio language selector, preferred playback speed, storage cache clearing, and help center. | None (Clean Settings) |
| `/upload/picker` | **Document Upload Sheet** | Native Android system file picker supporting PDF, DOCX, PPTX, TXT. File inspection and validation preview. | `Zuke-Uploading` |
| `/upload/configure`| **Audio Configuration** | Selection screen for Depth Mode (Quick / Standard / Deep Dive), Spoken Voice, and Output Language (English / Hinglish). | `Zuke-Thinking` |
| `/upload/processing`| **Processing & Assembly** | Real-time animated progress screen tracking: Extracting $\rightarrow$ Synthesizing $\rightarrow$ Vocalizing. Displays witty micro-tips while waiting. | `Zuke-Thinking` (Animated) |
| `/player/full` | **Full Audio Player** | Immersive Apple-style player. Gradient mesh background, interactive scrub bar, speed pills, chapter markers, and synced karaoke transcript. | `Zuke-Listening` |
| `/paywall` | **Zukai Pro Paywall** | High-conversion subscription screen. Feature matrix comparison, Google Play Billing integration, testimonials, and FAQ. | `Zuke-Paywall` |
| `/org/members` | **Team Members & RBAC** | Admin view for listing team members, pending invites, role changes (Member $\leftrightarrow$ Admin), and removal. | None (Data Table) |
| `/error` | **Global Error Screen** | Friendly fallback for network disconnects, server timeouts, or quota rejections. Includes one-tap retry button. | `Zuke-Error` |

