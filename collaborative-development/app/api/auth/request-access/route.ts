import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateEmailExistence } from "@/lib/email-validation";

const ALLOWED_ROLES = ["supplier", "transporter", "inventory manager"] as const;

function normalizeRole(role?: string): (typeof ALLOWED_ROLES)[number] {
  return ALLOWED_ROLES.includes((role ?? "") as (typeof ALLOWED_ROLES)[number])
    ? (role as (typeof ALLOWED_ROLES)[number])
    : "inventory manager";
}

/**
 * POST /api/auth/request-access
 * Body: { name, email, phone?, requested_role, reason?, terms_accepted }
 *
 * Saves a new access request to the access_requests table.
 * No auth account is created at this stage.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, requested_role, reason, organization_id, terms_accepted } =
      body as {
        name: string;
        email: string;
        phone?: string;
        requested_role?: string;
        reason?: string;
        organization_id?: string;
        terms_accepted?: boolean;
      };

    // ── Validation ──────────────────────────────────────────────────────────
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    const emailValidation = await validateEmailExistence(email);
    if (!emailValidation.valid) {
      return NextResponse.json(
        { error: emailValidation.reason || "Please provide a valid and existing email address." },
        { status: 400 }
      );
    }

    if (!terms_accepted) {
      return NextResponse.json(
        { error: "You must accept the Terms and Conditions." },
        { status: 400 }
      );
    }

    // ── Supabase Admin client (bypasses RLS to safely check and delete old requests) ────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Check if this email is already registered in the users table
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email.trim().toLowerCase())
      .maybeSingle();

    if (existingUser) {
      return NextResponse.json(
        { error: "This email address is already registered in our system." },
        { status: 400 }
      );
    }

    const normalizedRole = normalizeRole(requested_role);
    const trimmedEmail = email.trim().toLowerCase();

    // ── Check for existing requests with this email ───────────────────
    const { data: existingRequests } = await supabase
      .from("access_requests")
      .select("id, status")
      .eq("email", trimmedEmail);

    if (existingRequests && existingRequests.length > 0) {
      const pending = existingRequests.find((r) => r.status === "pending");
      const approved = existingRequests.find((r) => r.status === "approved");

      if (pending) {
        return NextResponse.json(
          { error: "A request with this email is already pending. Please wait for admin review." },
          { status: 409 }
        );
      }

      if (approved) {
        return NextResponse.json(
          { error: "This email has already been approved. Please sign in instead." },
          { status: 409 }
        );
      }

      // If all existing requests are rejected, delete them so user can re-apply
      const rejectedIds = existingRequests
        .filter((r) => r.status === "rejected")
        .map((r) => r.id);

      if (rejectedIds.length > 0) {
        await supabase
          .from("access_requests")
          .delete()
          .in("id", rejectedIds);
        console.log("[REQUEST-ACCESS] Cleared old rejected requests for:", trimmedEmail);
      }
    }

    // ── Insert into access_requests ─────────────────────────────────────────
    const { error } = await supabase.from("access_requests").insert({
      name: name.trim(),
      email: trimmedEmail,
      phone: phone?.trim() || null,
      requested_role: normalizedRole,
      reason: reason?.trim() || null,
      organization_id: organization_id || null,
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
      status: "pending",
    });

    if (error) {
      console.error("[REQUEST-ACCESS] Insert error:", error);

      // Duplicate email → already submitted (fallback safety net)
      if (
        error.code === "23505" ||
        error.message?.toLowerCase().includes("unique")
      ) {
        return NextResponse.json(
          {
            error:
              "A request with this email has already been submitted. Please wait for admin review.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: `Failed to submit request: ${error.message}` },
        { status: 500 }
      );
    }

    console.log("[REQUEST-ACCESS] Request submitted for:", email);

    return NextResponse.json(
      { message: "Request submitted successfully." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[REQUEST-ACCESS] Unexpected error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
