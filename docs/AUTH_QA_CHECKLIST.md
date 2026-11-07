# Zukai Phase 3 — Manual Authentication QA Checklist

This checklist covers end-to-end manual QA for Zukai's authentication flows, deep links, and account lifecycle on Android.

---

## Pre-Requisites
- Android emulator (Pixel 4 XL API 37) or physical device running development build.
- Supabase project URL and anon key configured in `.env`.
- Google Cloud Web & Android Client IDs created and added to Supabase.

---

## Test Scenarios

### 1. Fresh Install & First Launch
- [ ] Install app cleanly (`npx expo start --android`).
- [ ] Verify Animated Splash Screen (`⚡ ZUKAI`) displays smoothly without flicker.
- [ ] Verify app transitions to Onboarding Slide 1 ("Upload Anything") with Zuke mascot.
- [ ] Swipe or tap **Next** through Slides 1, 2, and 3.
- [ ] Verify **Skip** on Slide 1 jumps directly to Sign In.
- [ ] Verify `ShinyButton` renders glossy green top highlight and idle shimmer sweeps across.

### 2. Sign Up (Email & Password)
- [ ] Tap **Sign Up** from Sign In screen.
- [ ] Attempt submit with blank fields -> verify inline errors:
  - "Name must be at least 2 characters"
  - "Email is required"
  - "Password must be at least 8 characters"
  - "You must agree to the Terms of Service"
- [ ] Type password -> verify dynamic Password Strength Meter updates:
  - "Weak" (red) for < 8 chars
  - "Fair" (gold) for 8 chars + numbers
  - "Strong" (volt green) for mixed case + numbers + symbols
- [ ] Check terms checkbox, fill valid details, tap **Create Account**.
- [ ] Verify haptic success tick and transition to **Check Your Email** (`verify-email`) screen.

### 3. Email Verification Flow
- [ ] On `verify-email` screen, verify target email address is displayed.
- [ ] Tap **Resend Verification Email** -> verify success badge appears and 60-second cooldown timer begins countdown.
- [ ] Verify resend button is disabled during countdown.
- [ ] Click verification link in email (or deep link `zukai://auth/callback?code=xxx`).
- [ ] Verify app opens and exchanges session token automatically.

### 4. Language Choice & Profile Step
- [ ] Once authenticated with `onboarding_completed = false`, verify app presents the Language Selection screen.
- [ ] Toggle between **English** and **Hinglish** using the spring toggle.
- [ ] Tap **Start Learning** -> verify `preferred_language` saves and `onboarding_completed` is set to `true`.
- [ ] Verify app routes into `(tabs)/home`.

### 5. Sign In Validation & Throttling
- [ ] Sign out from Settings.
- [ ] Enter wrong password 5 consecutive times.
- [ ] Verify client-side rate limit triggers:
  - "Too many failed attempts. Sign-in is temporarily paused for 30 seconds."
  - Submit button disabled until countdown completes.
- [ ] Enter correct email and password -> verify immediate sign in to Home dashboard.

### 6. Forgot & Reset Password Flow
- [ ] On Sign In screen, tap **Forgot Password?**.
- [ ] Enter registered email -> tap **Send Reset Link**.
- [ ] Verify success confirmation card displays.
- [ ] Trigger reset deep link: `zukai://auth/reset-password`.
- [ ] Verify **Create New Password** screen opens.
- [ ] Enter matching 8+ character password, tap **Update Password**.
- [ ] Verify success banner and ability to sign in with new password.

### 7. Native Google Sign-In
- [ ] On Sign In screen, tap **Continue with Google**.
- [ ] Verify native Android Google Account picker dialog appears.
- [ ] Select Google account -> verify ID token exchanges with Supabase without web redirects.
- [ ] Verify user lands on Home dashboard with Google profile name and email populated in Settings.

### 8. Session Persistence & App Restart
- [ ] While signed in, kill the app process completely (`adb shell am force-stop com.zukai.app` or swipe dismiss in recents).
- [ ] Re-open the app.
- [ ] Verify app opens directly to Home dashboard without flashing the sign-in screen.
- [ ] Send app to background for 30 seconds, bring to foreground -> verify session refresh listener executes without error.

### 9. Offline Handling & Airplane Mode
- [ ] Turn on Airplane Mode in emulator settings.
- [ ] Re-open app with cached session -> verify user remains in app without crashes.
- [ ] Attempt network action -> verify friendly "Network Error" message rather than unhandled exception.

### 10. Account Deletion (Google Play Compliance)
- [ ] Navigate to **Settings** -> scroll down to **Danger Zone**.
- [ ] Tap **Delete Account & Data**.
- [ ] Verify security confirmation modal opens.
- [ ] Try typing random text -> verify **Permanently Delete Account** button remains disabled.
- [ ] Type exact word `DELETE` -> tap button.
- [ ] Verify Supabase Edge Function `delete-account` executes, auth user and profile are deleted from database.
- [ ] Verify app clears all local tokens and returns cleanly to Onboarding.

