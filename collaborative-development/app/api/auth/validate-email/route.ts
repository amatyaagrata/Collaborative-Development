import { NextResponse } from "next/server";
import { validateEmailExistence } from "@/lib/email-validation";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ valid: false, reason: "Email is required" }, { status: 400 });
    }

    const result = await validateEmailExistence(email);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ valid: false, reason: "Internal server error" }, { status: 500 });
  }
}
