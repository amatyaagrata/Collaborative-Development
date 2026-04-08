import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    console.log("[SIGNUP-API] Request received");
    const body = await request.json();
    console.log("[SIGNUP-API] Body received:", {
      email: body.email,
      name: body.name,
      role: body.role,
      organization_name: body.organization_name,
    });

    const {
      auth_user_id,
      email,
      name,
      role = "inventory manager",
      organization_name,
      phone,
    } = body as {
      auth_user_id: string;
      email: string;
      name: string;
      role?: string;
      organization_name?: string;
      phone?: string;
    };

    // Validate required fields
    if (!auth_user_id || !email || !name) {
      console.error("[SIGNUP-API] Missing required fields:", { auth_user_id, email, name });
      return NextResponse.json(
        { error: "auth_user_id, email, and name are required." },
        { status: 400 }
      );
    }

    console.log("[SIGNUP-API] Creating admin client...");
    const supabase = createAdminClient();
    console.log("[SIGNUP-API] Admin client created successfully");

    // Validate and normalize role
    const allowedRoles = ["admin", "supplier", "transporter", "inventory manager"];
    const normalizedRole = allowedRoles.includes(role) ? role : "inventory manager";
    console.log("[SIGNUP-API] Role validation:", { requested: role, normalized: normalizedRole });

    // Step 1: Upsert user record
    console.log("[SIGNUP-API] Step 1/2: Upserting user record...");
    const { data: userData, error: userError } = await supabase
      .from("users")
      .upsert(
        {
          auth_user_id,
          name,
          email,
          role: normalizedRole,
          phone,
          organization_name,
        },
        { onConflict: "auth_user_id" }
      )
      .select();

    if (userError) {
      console.error("[SIGNUP-API] User upsert error:", userError);
      return NextResponse.json(
        {
          error: `User record creation failed: ${userError.message}`,
          code: userError.code,
          details: userError.details,
        },
        { status: 500 }
      );
    }

    console.log("[SIGNUP-API] User record upserted successfully:", userData);

    // Step 2: Upsert user_roles record
    console.log("[SIGNUP-API] Step 2/2: Upserting user_roles record...");
    const { data: roleData, error: roleError } = await supabase
      .from("user_roles")
      .upsert(
        {
          user_id: auth_user_id,
          role: normalizedRole,
          organization_name,
        },
        { onConflict: "user_id" }
      )
      .select();

    if (roleError) {
      console.error("[SIGNUP-API] User roles upsert error:", roleError);
      return NextResponse.json(
        {
          error: `User role record creation failed: ${roleError.message}`,
          code: roleError.code,
          details: roleError.details,
        },
        { status: 500 }
      );
    }

    console.log("[SIGNUP-API] User roles record upserted successfully:", roleData);
    console.log("[SIGNUP-API] Signup completed successfully for user:", auth_user_id);

    return NextResponse.json(
      {
        message: "Profile created successfully.",
        user_id: auth_user_id,
        role: normalizedRole,
        email,
        name,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SIGNUP-API] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
