import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const ALLOWED_ROLES = ["admin", "supplier", "transporter", "inventory manager"] as const;

function normalizeRole(role?: string) {
  return ALLOWED_ROLES.includes((role ?? "") as (typeof ALLOWED_ROLES)[number])
    ? (role as (typeof ALLOWED_ROLES)[number])
    : "inventory manager";
}

function getRoleRedirect(role: string) {
  switch (role) {
    case "admin":
      return "/admin/dashboard";
    case "supplier":
      return "/suppliers/dashboard";
    case "transporter":
      return "/driver/dashboard";
    default:
      return "/dashboard";
  }
}

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

    // Get user role from user_roles table
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleError) console.error("[GET-ROLE] Error fetching role from user_roles:", roleError);

    const metadataRoleRaw = user.user_metadata?.role;
    const metadataRole = typeof metadataRoleRaw === "string" ? normalizeRole(metadataRoleRaw) : undefined;
    const role = normalizeRole(roleData?.role ?? metadataRole);
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
