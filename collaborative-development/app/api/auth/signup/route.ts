import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient, hasAdminClientConfig } from "@/lib/supabase/admin";

const ALLOWED_ROLES = ["admin", "supplier", "transporter", "inventory manager"] as const;

function normalizeRole(role?: string) {
  return ALLOWED_ROLES.includes((role ?? "") as (typeof ALLOWED_ROLES)[number])
    ? (role as (typeof ALLOWED_ROLES)[number])
    : "inventory manager";
}

function isMissingTableError(error: { code?: string; message?: string }) {
  return error.code === "PGRST205" || error.message?.toLowerCase().includes("could not find the table");
}

function getAuthErrorStatus(error: { code?: string; message?: string; status?: number }) {
  if (typeof error.status === "number" && error.status >= 400 && error.status < 600) {
    return error.status;
  }

  const message = error.message?.toLowerCase() ?? "";

  if (error.code === "validation_failed" || message.includes("invalid")) {
    return 400;
  }

  if (message.includes("rate limit") || message.includes("too many requests")) {
    return 429;
  }

  return 500;
}

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
      console.error("[SIGNUP-API] Missing required fields:", { email, name });
      return NextResponse.json(
        { error: "email and name are required." },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        {
          error:
            "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY.",
        },
        { status: 500 }
      );
    }

    const hasAdminConfig = hasAdminClientConfig();
    console.log("[SIGNUP-API] Creating Supabase client...", { hasAdminConfig });
    const supabase = hasAdminConfig
      ? createAdminClient()
      : createClient(supabaseUrl, supabaseAnonKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        });
    console.log("[SIGNUP-API] Supabase client created successfully");

    const normalizedRole = normalizeRole(role);
    console.log("[SIGNUP-API] Role validation:", { requested: role, normalized: normalizedRole });
    const warnings: string[] = [];
    let resolvedAuthUserId = auth_user_id;

    if (!resolvedAuthUserId) {
      if (!password || password.length < 6) {
        return NextResponse.json(
          { error: "password with at least 6 characters is required when auth_user_id is not provided." },
          { status: 400 }
        );
      }

      console.log("[SIGNUP-API] No auth_user_id provided. Creating auth user...");
      const createAuthResult = hasAdminConfig
        ? await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
              name,
              role: normalizedRole,
              organization_name,
              phone,
            },
          })
        : await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                name,
                role: normalizedRole,
                organization_name,
                phone,
              },
            },
          });

      const { data: createdUserData, error: createAuthError } = createAuthResult;

      if (createAuthError) {
        console.error("[SIGNUP-API] Auth user creation failed:", createAuthError);
        const msg = createAuthError.message.toLowerCase();
        if (msg.includes("already") || msg.includes("duplicate")) {
          return NextResponse.json(
            {
              error: "An account with this email already exists. Please log in instead.",
              code: createAuthError.code,
            },
            { status: 409 }
          );
        }
        return NextResponse.json(
          {
            error: `Auth user creation failed: ${createAuthError.message}`,
            code: createAuthError.code,
          },
          { status: getAuthErrorStatus(createAuthError) }
        );
      }

      resolvedAuthUserId = createdUserData.user?.id;
      if (!resolvedAuthUserId) {
        return NextResponse.json(
          { error: "Auth user was created but no user id was returned." },
          { status: 500 }
        );
      }
      console.log("[SIGNUP-API] Auth user created:", resolvedAuthUserId);

      if (!hasAdminConfig) {
        warnings.push(
          "SUPABASE_SERVICE_ROLE_KEY is not configured, so profile tables were not updated automatically."
        );
      }
    }

    // Step 1: Try to upsert organization (new schema) or fall back (old schema)
    if (hasAdminConfig) {
      let organizationId: string | undefined;

      // Try new schema: organizations table
      try {
        console.log("[SIGNUP-API] Step 1/3: Checking for organizations table...");
        const orgName = organization_name || "Default Organization";
        const orgSlug = orgName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

        const { data: existingOrg } = await supabase
          .from("organizations")
          .select("id")
          .eq("name", orgName)
          .single();

        if (existingOrg) {
          organizationId = existingOrg.id;
          console.log("[SIGNUP-API] Found existing organization:", organizationId);
        } else {
          const { data: newOrg, error: orgError } = await supabase
            .from("organizations")
            .insert({ name: orgName, slug: orgSlug })
            .select("id")
            .single();

          if (orgError) {
            console.warn("[SIGNUP-API] Org creation failed (may be old schema):", orgError.message);
          } else {
            organizationId = newOrg.id;
            console.log("[SIGNUP-API] Created new organization:", organizationId);
          }
        }
      } catch (e) {
        console.warn("[SIGNUP-API] Organizations table not available, using old schema", e);
      }

      // Step 2: Upsert user record
      console.log("[SIGNUP-API] Step 2/3: Upserting user record...");
      const userPayload: Record<string, unknown> = {
        auth_user_id: resolvedAuthUserId,
        name,
        email,
        role: normalizedRole,
        phone,
      };
      if (organizationId) {
        userPayload.organization_id = organizationId;
      } else {
        userPayload.organization_name = organization_name;
      }

      const { data: userData, error: userError } = await supabase
        .from("users")
        .upsert(userPayload, { onConflict: "auth_user_id" })
        .select();

      if (userError) {
        console.error("[SIGNUP-API] User upsert error:", userError);
        if (isMissingTableError(userError)) {
          warnings.push("users table not found; profile record was skipped.");
        } else {
          return NextResponse.json(
            {
              error: `User record creation failed: ${userError.message}`,
              code: userError.code,
              details: userError.details,
            },
            { status: 500 }
          );
        }
      }

      console.log("[SIGNUP-API] User record upserted successfully:", userData);

      // Step 3: Upsert user_roles record
      console.log("[SIGNUP-API] Step 3/3: Upserting user_roles record...");
      const rolePayload: Record<string, unknown> = {
        user_id: resolvedAuthUserId,
        role: normalizedRole,
      };
      if (organizationId) {
        rolePayload.organization_id = organizationId;
      } else {
        rolePayload.organization_name = organization_name;
      }

      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .upsert(rolePayload, { onConflict: "user_id" })
        .select();

      if (roleError) {
        console.error("[SIGNUP-API] User roles upsert error:", roleError);
        if (isMissingTableError(roleError)) {
          warnings.push("user_roles table not found; role record was skipped.");
        } else {
          return NextResponse.json(
            {
              error: `User role record creation failed: ${roleError.message}`,
              code: roleError.code,
              details: roleError.details,
            },
            { status: 500 }
          );
        }
      }

      console.log("[SIGNUP-API] User roles record upserted successfully:", roleData);
    }
    console.log("[SIGNUP-API] Signup completed successfully for user:", resolvedAuthUserId);

    return NextResponse.json(
      {
        message: warnings.length ? "Signup completed with warnings." : "Profile created successfully.",
        user_id: resolvedAuthUserId,
        role: normalizedRole,
        email,
        name,
        warnings,
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
