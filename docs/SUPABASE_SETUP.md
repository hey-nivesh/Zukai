# Zukai — Supabase Dashboard & Google Cloud Setup Checklist

This document details the configuration required in the Supabase Dashboard and Google Cloud Console for Phase 3 authentication.

---

## 1. Supabase Dashboard Configuration Checklist

Navigate to your Supabase project dashboard at [https://supabase.com/dashboard](https://supabase.com/dashboard).

### A. Authentication -> URL Configuration
- [ ] **Site URL:**
  ```
  zukai://auth/callback
  ```
- [ ] **Redirect URLs (Allow list):**
  Add the following URIs:
  ```
  zukai://*
  zukai://auth/callback
  zukai://auth/reset-password
  http://localhost:8081
  http://localhost:8081/--/auth/callback
  ```

### B. Authentication -> Providers -> Email
- [ ] **Enable Email Provider:** ON
- [ ] **Confirm Email:** ON (Enforces email verification before account activation)
- [ ] **Secure Email Change:** ON
- [ ] **Minimum Password Length:** `8`
- [ ] **Password Requirements:** Require letters, numbers, and symbols

### C. Authentication -> Providers -> Google
- [ ] **Enable Google Provider:** ON
- [ ] **Client ID (Web):** Obtain from Google Cloud Console (see Section 2 below)
- [ ] **Client Secret:** Obtain from Google Cloud Console
- [ ] **Authorized Client IDs:** Paste both Web Client ID and Android Client ID

### D. Authentication -> Rate Limits
- [ ] **Email Sign-ins:** 30 per hour
- [ ] **Email Sign-ups:** 15 per hour
- [ ] **Token Refresh:** 180 per minute

### E. Custom SMTP Provider (Critical for Production)
> [!WARNING]
> Supabase's default shared SMTP service has severe rate limits (approx 3–4 emails per hour). In production, configure a custom SMTP server (such as [Resend](https://resend.com), SendGrid, or AWS SES) under:
> **Project Settings -> Authentication -> SMTP Settings**.

---

## 2. Google Cloud Console Setup (Native Google Sign-In)

Native Google Sign-In on Android uses `@react-native-google-signin/google-signin` and exchanges an ID token with Supabase (`signInWithIdToken`).

### Steps:
1. Open the [Google Cloud Console](https://console.cloud.google.com).
2. Select your project (or create one named `Zukai`).
3. Navigate to **APIs & Services -> Credentials**.
4. **Create Web Client ID (Required for Supabase token verification):**
   - Click **Create Credentials -> OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Zukai Web Client`.
   - Copy the generated **Client ID** and **Client Secret**.
   - Paste these into the Supabase Dashboard (under Google Provider).
5. **Create Android Client ID (Required for Android device recognition):**
   - Click **Create Credentials -> OAuth client ID**.
   - Application type: **Android**.
   - Name: `Zukai Android App`.
   - Package name: `com.zukai.app`.
   - SHA-1 certificate fingerprint:
     - For local development build: Run `cd android && ./gradlew signingReport` or `keytool -keystore ~/.android/debug.keystore -list -v` to get the debug SHA-1.
     - For EAS build: Run `eas credentials` to retrieve the Google Play / production SHA-1 fingerprint.
6. In `app.json`, the Web Client ID is passed to GoogleSignin configure via `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

---

## 3. Database Migration Deployment

To push migrations to your remote Supabase instance:

```bash
# Link project (first time only)
npx supabase link --project-ref your-project-ref

# Push migration 001
npx supabase db push
```

Or copy the contents of `supabase/migrations/20261107000001_profiles.sql` into the Supabase Dashboard **SQL Editor** and click **Run**.

---

## 4. Deploying Edge Functions

Deploy the account deletion Edge Function:

```bash
npx supabase functions deploy delete-account
```

Ensure `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL` are configured in project secrets (injected automatically in Supabase managed functions).

