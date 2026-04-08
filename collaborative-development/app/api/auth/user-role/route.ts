import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * GET /api/auth/user-role
 * Fetches the current user's role and returns the correct dashboard redirect
 */
export async function GET(request: Request) {
  try {
    console.log("[GET-ROLE] Request received");
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    if (roleError) {
      console.error("[GET-ROLE] Error fetching role:", roleError);
      // If role doesn't exist, default to inventory manager
      return NextResponse.json({
        role: "inventory manager",
        redirect: "/dashboard",
      });
    }

    console.log("[GET-ROLE] User role:", roleData?.role);

    // Determine redirect based on role
    const role = roleData?.role || "inventory manager";
    let redirect = "/dashboard";

    switch (role) {
      case "admin":
        redirect = "/admin/dashboard";
        break;
      case "supplier":
        redirect = "/suppliers/dashboard";
        break;
      case "transporter":
        redirect = "/driver/dashboard";
        break;
      case "inventory manager":
        redirect = "/dashboard";
        break;
      default:
        redirect = "/dashboard";
    }

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
