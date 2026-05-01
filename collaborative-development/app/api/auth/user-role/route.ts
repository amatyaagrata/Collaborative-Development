import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { normalizeRole, getRoleRedirect } from "@/lib/roles/config";

/**
 * GET /api/auth/user-role
 * Fetches the current user's role and returns the correct dashboard redirect
 */
export async function GET() {
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

    let roleStr: string | undefined;

    // 1. Try profiles table first (new schema)
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      if (profile?.role) roleStr = profile.role;
    } catch { /* profiles table may not exist */ }

    // 2. Fallback to user_roles table (old schema)
    if (!roleStr) {
      try {
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .single();
        if (roleData?.role) roleStr = roleData.role;
      } catch { /* user_roles table may not exist */ }
    }

    // 3. Fallback to user metadata
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
