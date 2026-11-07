/**
 * ZUKAI USAGE & QUOTA API REPOSITORY
 * Location: /zukai/src/features/usage/api/usageApi.ts
 * Description: Data access layer for plan quotas, metered consumption, and usage summaries
 */

import { supabase } from '@/lib/supabase';
import { PlanTier } from '@/types/database';

export interface UsageSummary {
  tier: PlanTier;
  monthly_audio_minutes_limit: number;
  monthly_audio_minutes_used: number;
  max_documents_limit: number;
  documents_count: number;
  active_jobs_count: number;
  period_start: string;
  period_end: string;
}

export async function fetchUsageSummary(orgId?: string | null): Promise<UsageSummary> {
  const { data, error } = await supabase.rpc('get_usage_summary', {
    p_org_id: orgId ?? null,
  });

  if (error) throw error;
  return data as UsageSummary;
}

