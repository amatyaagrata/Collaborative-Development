import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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
    const { name, email, phone, requested_role, reason, terms_accepted } =
      body as {
        name: string;
        email: string;
        phone?: string;
        requested_role?: string;
        reason?: string;
        terms_accepted?: boolean;
      };

    // ── Validation ──────────────────────────────────────────────────────────
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    if (!terms_accepted) {
      return NextResponse.json(
        { error: "You must accept the Terms and Conditions." },
        { status: 400 }
      );
    }

    // ── Supabase client (anon key is fine — INSERT policy allows all) ────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey =
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const normalizedRole = normalizeRole(requested_role);

    // ── Insert into access_requests ─────────────────────────────────────────
    const { error } = await supabase.from("access_requests").insert({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || null,
      requested_role: normalizedRole,
      reason: reason?.trim() || null,
      terms_accepted: true,
      terms_accepted_at: new Date().toISOString(),
      status: "pending",
    });

    if (error) {
      console.error("[REQUEST-ACCESS] Insert error:", error);

      // Duplicate email → already submitted
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
