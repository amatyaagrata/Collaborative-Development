import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient, hasAdminClientConfig } from "@/lib/supabase/admin";
import { validateEmailExistence } from "@/lib/email-validation";

const ALLOWED_ROLES = ["admin", "supplier", "transporter", "inventory manager"] as const;

function normalizeRole(role?: string) {
  return ALLOWED_ROLES.includes((role ?? "") as (typeof ALLOWED_ROLES)[number])
    ? (role as (typeof ALLOWED_ROLES)[number])
    : "inventory manager";
}

function isMissingTableError(error: { code?: string; message?: string }) {
  return error.code === "PGRST205" || error.message?.toLowerCase().includes("could not find the table");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      auth_user_id,
      email,
      password,
      name,
      role = "inventory manager",
      organization_name,
      phone,
    } = body as {
      auth_user_id?: string;
      email: string;
      password?: string;
      name: string;
      role?: string;
      organization_name?: string;
      phone?: string;
    };

    if (!email || !name) {
      return NextResponse.json({ error: "email and name are required." }, { status: 400 });
    }

    // Email validation
    const emailValidation = await validateEmailExistence(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.reason || "Invalid email address." },
        { status: 400 }
      );
    }

    const hasAdminConfig = hasAdminClientConfig();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = hasAdminConfig
      ? createAdminClient()
      : createClient(supabaseUrl, supabaseAnonKey);

    const normalizedRole = normalizeRole(role);
    const warnings: string[] = [];
    let resolvedAuthUserId = auth_user_id;

    if (!resolvedAuthUserId) {
      console.log("[SIGNUP-API] Checking for existing auth account...");
      
      const createAuthResult = hasAdminConfig
        ? await supabase.auth.admin.createUser({
            email,
            password: password || Math.random().toString(36).slice(-10),
            email_confirm: true,
            user_metadata: { name, role: normalizedRole, organization_name, phone },
          })
        : await supabase.auth.signUp({
            email,
            password: password!,
            options: { data: { name, role: normalizedRole, organization_name, phone } },
          });

      const { data: authData, error: authError } = createAuthResult;

      if (authError) {
        const msg = authError.message.toLowerCase();
        // Self-healing: if user exists, find them
        if (msg.includes("already") || msg.includes("duplicate") || authError.status === 409) {
          if (hasAdminConfig) {
            const { data: { users } } = await (supabase.auth as any).admin.listUsers();
            const existingUser = users.find((u: any) => u.email === email);
            if (existingUser) resolvedAuthUserId = existingUser.id;
          }
        }

        if (!resolvedAuthUserId) {
          return NextResponse.json({ error: authError.message }, { status: authError.status || 400 });
        }
      } else {
        resolvedAuthUserId = authData.user?.id;
      }
    }

    if (!resolvedAuthUserId) {
      return NextResponse.json({ error: "Could not resolve user ID." }, { status: 500 });
    }

    // Step 1: Organization handling
    let organizationId: string | undefined;
    if (hasAdminConfig) {
      try {
        const orgName = organization_name || "Default Organization";
        const { data: existingOrg } = await supabase
          .from("organizations")
          .select("id")
          .eq("name", orgName)
          .maybeSingle();

        if (existingOrg) {
          organizationId = existingOrg.id;
        } else {
          const { data: newOrg } = await supabase
            .from("organizations")
            .insert({ name: orgName, slug: orgName.toLowerCase().replace(/\s+/g, "-") })
            .select("id")
            .single();
          organizationId = newOrg?.id;
        }
      } catch (e) {
        console.warn("[SIGNUP-API] Org step skipped", e);
      }

      // Step 2: Users table
      const { error: userError } = await supabase
        .from("users")
        .upsert({
          auth_user_id: resolvedAuthUserId,
          name,
          email,
          role: normalizedRole,
          phone,
          organization_id: organizationId,
        });

      if (userError && !isMissingTableError(userError)) {
        console.error("[SIGNUP-API] User upsert error:", userError);
      }

      // Step 3: Roles table
      const { error: roleError } = await supabase
        .from("user_roles")
        .upsert({
          user_id: resolvedAuthUserId,
          role: normalizedRole,
          organization_id: organizationId,
        });

      if (roleError && !isMissingTableError(roleError)) {
        console.error("[SIGNUP-API] Role upsert error:", roleError);
      }
    }

    return NextResponse.json({
      message: "Success",
      user_id: resolvedAuthUserId,
      role: normalizedRole,
    }, { status: 200 });

  } catch (error) {
    console.error("[SIGNUP-API] Unexpected error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
