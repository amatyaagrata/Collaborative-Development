import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendOTPEmail } from "@/lib/email-service";

/**
 * POST /api/auth/send-otp
 * Body: { email }
 *
 * Generates a 6-digit OTP code, saves it to the database, 
 * and sends it via Resend.
 */
export async function POST(request: Request) {
  try {
    const { email } = (await request.json()) as { email?: string };

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    // Generate a random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes from now

    const supabase = createAdminClient();

    // Save OTP to the new verifications table
    const { error: dbError } = await supabase
      .from("otp_verifications")
      .insert({
        email: email.trim().toLowerCase(),
        code: otpCode,
        expires_at: expiresAt,
      });

    if (dbError) {
      console.error("[SEND-OTP] Database error:", dbError);
      return NextResponse.json({ error: "Failed to initialize verification." }, { status: 500 });
    }

    // Send the beautiful email via Resend
    const emailResult = await sendOTPEmail(email.trim().toLowerCase(), otpCode) as any;

    if (!emailResult.success) {
      const errorMessage = emailResult.error?.message || "Failed to send email via Resend.";
      return NextResponse.json(
        { error: `${errorMessage} (Check terminal for details)` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "A verification code has been sent to your email via Resend!",
    });
  } catch (err) {
    console.error("[SEND-OTP] Unexpected error:", err);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
