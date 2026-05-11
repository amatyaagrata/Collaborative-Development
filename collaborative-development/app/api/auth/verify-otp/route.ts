import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/auth/verify-otp
 * Body: { email, token }
 *
 * Verifies the 6-digit OTP code against the otp_verifications table.
 */
export async function POST(request: Request) {
  try {
    const { email, token } = (await request.json()) as {
      email?: string;
      token?: string;
    };

    if (!email || !token) {
      return NextResponse.json(
        { verified: false, error: "Email and verification code are required." },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();
    const cleanEmail = email.trim().toLowerCase();

    // Check the database for the OTP
    const { data: otpRecord, error: fetchError } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("email", cleanEmail)
      .eq("code", token.trim())
      .gt("expires_at", new Date().toISOString()) // Must not be expired
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      console.error("[VERIFY-OTP] Database error:", fetchError);
      return NextResponse.json({ verified: false, error: "Database error during verification." }, { status: 500 });
    }

    if (!otpRecord) {
      return NextResponse.json(
        { verified: false, error: "Invalid or expired verification code." },
        { status: 400 }
      );
    }

    // Success! Delete the OTP record so it can't be used again
    await supabase
      .from("otp_verifications")
      .delete()
      .eq("email", cleanEmail);

    console.log("[VERIFY-OTP] Email verified successfully:", cleanEmail);

    return NextResponse.json({
      verified: true,
      message: "Email verified successfully!",
    });
  } catch (err) {
    console.error("[VERIFY-OTP] Unexpected error:", err);
    return NextResponse.json(
      { verified: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}
