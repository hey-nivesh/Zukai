/**
 * ZUKAI ORGANIZATIONS API REPOSITORY
 * Location: /zukai/src/features/organizations/api/organizationsApi.ts
 * Description: Data access layer for tenant organizations, memberships, and creation
 */

import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database';

export type OrganizationRow = Database['public']['Tables']['organizations']['Row'];
export type MembershipRow = Database['public']['Tables']['memberships']['Row'];

export async function fetchOrganizations(): Promise<OrganizationRow[]> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function createOrganization(name: string, slug: string): Promise<OrganizationRow> {
  const { data, error } = await supabase.rpc('create_organization', {
    p_name: name,
    p_slug: slug,
  });

  if (error) throw error;
  return data;
}

export async function fetchMemberships(orgId: string): Promise<MembershipRow[]> {
  const { data, error } = await supabase
    .from('memberships')
    .select('*')
    .eq('org_id', orgId);

  if (error) throw error;
  return data ?? [];
}

