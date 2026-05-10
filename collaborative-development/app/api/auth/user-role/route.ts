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

    // 1. Primary: look up role from the users table (source of truth per schema)
    try {
      const { data: dbUser } = await supabase
        .from("users")
        .select("role, is_approved")
        .eq("auth_user_id", user.id)
        .single();

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

    // 2. Fallback: user metadata (set at signup)
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
