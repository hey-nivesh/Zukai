# Google Play Store Policy: User Account Deletion

Google Play policy requires all apps allowing account creation to provide:
1. An in-app path for users to delete their account and associated data.
2. A web-accessible URL where users can request account and data deletion without needing to reinstall the app.

---

## 1. In-App Deletion Path

Users can permanently delete their Zukai account directly inside the app:
1. Open **Zukai**.
2. Tap the **Settings** tab in the bottom navigation.
3. Scroll down to the **Danger Zone** section and tap **Delete Account**.
4. A security confirmation modal will appear.
5. The user must type `DELETE` into the confirmation field and tap **Permanently Delete Account**.
6. The app invokes the authenticated Supabase Edge Function (`delete-account`).
7. Upon successful deletion, the user's authentication credentials, profile row, preferences, and all associated stored data are permanently purged.

---

## 2. Web-Accessible Account Deletion Request URL

Provide this URL in the Google Play Console under **App Content -> Data Safety -> Account Deletion URL**:

```
https://zukai.app/account/delete
```

### Deletion Process for Web Requests:
- **Identifier Required:** User must provide their registered account email.
- **Verification:** An email containing a secure one-time confirmation token is sent to the address.
- **Data Retention & Purge Timeline:** Upon confirmation, all account data, profiles, and associated file assets are queued for permanent deletion and completely purged within 7 business days.
- **Exceptions:** No user data is retained after deletion, except when required by financial or legal compliance (e.g., Stripe invoice records).

