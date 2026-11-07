// ==============================================================================
// Supabase Edge Function: delete-account
// Location: /supabase/functions/delete-account/index.ts
// Compliance: Google Play Store Account Deletion & GDPR Erasure
// Description: Validates user JWT, checks org ownership constraints, purges storage,
//              writes an immutable audit log, and deletes the auth user via Admin API.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // 1. Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[delete-account] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Validate calling user's JWT
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const jwt = authHeader.replace("Bearer ", "").trim();
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired authentication session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    const userEmail = user.email || "";
    console.log(`[delete-account] Processing account deletion for user: ${userId}`);

    // 3. Organization Invariant Check: Block deletion if user is the last owner of an active organization
    const { data: ownedMemberships, error: memberQueryError } = await supabaseClient
      .from("memberships")
      .select("org_id, organizations(name)")
      .eq("user_id", userId)
      .eq("role", "owner");

    if (memberQueryError) {
      console.error("[delete-account] Error querying user memberships:", memberQueryError);
    }

    if (ownedMemberships && ownedMemberships.length > 0) {
      for (const m of ownedMemberships) {
        const { count, error: countError } = await supabaseClient
          .from("memberships")
          .select("*", { count: "exact", head: true })
          .eq("org_id", m.org_id)
          .eq("role", "owner")
          .neq("user_id", userId);

        if (!countError && count === 0) {
          const orgName = (m.organizations as any)?.name || m.org_id;
          return new Response(
            JSON.stringify({
              error: `Cannot delete account: You are the sole owner of organization '${orgName}'. Please transfer ownership or delete the organization first.`,
              code: "SOLE_OWNER_BLOCKED",
            }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
    }

    // 4. Purge Storage Objects across uploads, audio, and avatars
    const purgeBucketFolder = async (bucket: string, prefix: string) => {
      try {
        const { data: files, error: listError } = await supabaseClient.storage.from(bucket).list(prefix);
        if (!listError && files && files.length > 0) {
          const paths = files.map((f) => `${prefix}/${f.name}`);
          await supabaseClient.storage.from(bucket).remove(paths);
        }
      } catch (err) {
        console.warn(`[delete-account] Note during ${bucket} cleanup for ${prefix}:`, err);
      }
    };

    await Promise.allSettled([
      purgeBucketFolder("uploads", userId),
      purgeBucketFolder("audio", userId),
      purgeBucketFolder("avatars", userId),
    ]);

    // 5. Write an immutable audit log entry that survives user deletion (actor_id set null)
    try {
      await supabaseClient.from("audit_logs").insert({
        actor_id: null,
        org_id: null,
        action: "account.deleted",
        entity_type: "user",
        entity_id: userId,
        metadata: {
          deleted_user_id: userId,
          email_domain: userEmail.includes("@") ? userEmail.split("@")[1] : "unknown",
          timestamp: new Date().toISOString(),
        },
      });
    } catch (auditErr) {
      console.error("[delete-account] Failed to write account deletion audit log:", auditErr);
    }

    // 6. Delete auth.users entry using Admin API (cascades to public.profiles via foreign key)
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error(`[delete-account] Failed to delete user ${userId}:`, deleteError);
      return new Response(
        JSON.stringify({ error: deleteError.message || "Failed to delete user account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[delete-account] Successfully purged and deleted user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: "Account and associated data successfully purged" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    console.error("[delete-account] Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
