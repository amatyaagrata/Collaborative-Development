import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeRole, getRoleRedirect } from "@/lib/roles/config";

/**
 * GET /api/auth/user-role
 * Fetches the current user's role and returns the correct dashboard redirect.
 * 
 * Query params:
 *   ?orgs=true  → returns all organizations this user belongs to
 *   ?org_id=xxx → uses the role from a specific organization
 */
export async function GET(request: Request) {
  try {
    console.log("[GET-ROLE] Request received");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          error:
            "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.",
        },
        { status: 500 }
      );
    }
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error("[GET-ROLE] User not authenticated:", userError);
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    console.log("[GET-ROLE] User authenticated:", user.id);

    const url = new URL(request.url);
    const wantOrgs = url.searchParams.get("orgs") === "true";
    const chosenOrgId = url.searchParams.get("org_id");

    const adminClient = createAdminClient();

    // ── If ?orgs=true, return all organizations this user belongs to ──
    if (wantOrgs) {
      // Check user_roles table for all orgs
      const { data: roles } = await adminClient
        .from("user_roles")
        .select("role, organization_id, organizations(id, name)")
        .eq("user_id", user.id);

      // Also check users table for orgs (fallback)
      const { data: userRecords } = await adminClient
        .from("users")
        .select("role, organization_id, organizations(id, name)")
        .eq("auth_user_id", user.id);

      // Merge and deduplicate by organization_id
      const orgMap = new Map<string, { id: string; name: string; role: string }>();

      for (const r of (roles ?? [])) {
        const org = r.organizations as any;
        if (org?.id) {
          orgMap.set(org.id, { id: org.id, name: org.name, role: r.role });
        }
      }
      for (const u of (userRecords ?? [])) {
        const org = u.organizations as any;
        if (org?.id && !orgMap.has(org.id)) {
          orgMap.set(org.id, { id: org.id, name: org.name, role: u.role });
        }
      }

      const organizations = Array.from(orgMap.values());

      return NextResponse.json({
        user_id: user.id,
        email: user.email,
        organizations,
      });
    }

    // ── Normal role resolution (with optional org_id filter) ──
    let roleStr: string | undefined;

    // 1. If a specific org_id was chosen, look up that org's role
    if (chosenOrgId) {
      const { data: roleData } = await adminClient
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("organization_id", chosenOrgId)
        .maybeSingle();
      if (roleData?.role) roleStr = roleData.role;

      // Also try users table
      if (!roleStr) {
        const { data: userData } = await adminClient
          .from("users")
          .select("role, is_approved")
          .eq("auth_user_id", user.id)
          .eq("organization_id", chosenOrgId)
          .maybeSingle();
        if (userData?.role) {
          if (!userData.is_approved) {
             return NextResponse.json(
               { error: "Account pending approval. Please wait for admin approval." },
               { status: 403 }
             );
          }
          roleStr = userData.role;
        }
      }
    }

    // 2. Primary fallback: look up role from the users table (source of truth per schema)
    if (!roleStr) {
      try {
        const { data: dbUser } = await adminClient
          .from("users")
          .select("role, is_approved")
          .eq("auth_user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (dbUser?.role) {
          // Respect approval gate — unapproved users cannot access dashboards
          if (!dbUser.is_approved) {
            return NextResponse.json(
              { error: "Account pending approval. Please wait for admin approval." },
              { status: 403 }
            );
          }
          roleStr = dbUser.role;
        }
      } catch { /* users table query failed, fall through */ }
    }

    // 3. Fallback to user_roles table (first match)
    if (!roleStr) {
      try {
        const { data: roleData } = await adminClient
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        if (roleData?.role) roleStr = roleData.role;
      } catch { /* user_roles table may not exist */ }
    }

    // 4. Fallback to user metadata

    if (!roleStr && user.user_metadata?.role) {
      roleStr = user.user_metadata.role as string;
    }

    const role = normalizeRole(roleStr);
    const redirect = getRoleRedirect(role);

    console.log("[GET-ROLE] Returning role and redirect:", { role, redirect });

    return NextResponse.json(
      {
        role,
        redirect,
        user_id: user.id,
        email: user.email,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[GET-ROLE] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
