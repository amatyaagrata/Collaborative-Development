import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  
  console.log("Google OAuth initiated. Redirect URI:", `${baseUrl}/api/auth/google/callback`);
  
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${baseUrl}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });
  
  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
  console.log("Redirecting to Google...");
  
  return NextResponse.redirect(googleAuthUrl);
}