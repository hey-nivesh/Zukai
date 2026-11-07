# Zukai — GDPR Data Export Specification & Stub Design
**Document Version:** 1.0.0  
**Compliance:** GDPR Article 20 (Right to Data Portability) & CCPA/CPRA  
**Status:** Architecture Design Stub (Non-blocking for Phase 4)

---

## 1. Overview
Under GDPR Article 20, users are legally entitled to receive all personal data provided to a service in a structured, commonly used, and machine-readable format (JSON and media zip).

## 2. Planned RPC Signature
```sql
-- Stub definition (Future Phase Implementation)
create or replace function public.request_data_export()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- 1. Verify caller authentication
  -- 2. Enqueue export generation task into worker queue
  -- 3. Return export tracking job ID
  raise exception 'DATA_EXPORT_SCHEDULED: Data export generation is queued and will be delivered via email.'
    using errcode = 'P0099';
end;
$$;
```

## 3. Data Ingestion & Export Scope
When the asynchronous worker processes a data export request:
1. **User Profile & Settings:** `profiles` row, preference history, and app theme configuration.
2. **Personal Documents:** Metadata records from `documents` where `owner_id = user_id`, plus signed download URLs for original uploaded files.
3. **Audio History:** All generated audio tracks, chapters, and full transcript texts where `owner_id = user_id`.
4. **Playback Metrics:** `playback_progress` entries across all devices.
5. **Subscription & Billing Receipts:** Subscription tier history from `subscriptions` and metered consumption logs from `usage_events`.
6. **Audit Records:** User-initiated audit entries from `audit_logs` where `actor_id = user_id`.

## 4. Delivery & Security Mechanics
- Generated exports are bundled into an encrypted `.zip` archive.
- The archive is staged in a private, expiring storage bucket (`exports/{user_id}/{export_id}.zip`) with a 48-hour time-to-live (TTL).
- A short-lived (60-minute), single-use signed download URL is emailed to the user's verified primary address.
- Download access requires active re-authentication with password or biometric passkey.

