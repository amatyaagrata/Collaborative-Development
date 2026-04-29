import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  
  if (error) {
    console.error("Google OAuth error:", error);
    return NextResponse.redirect(`${baseUrl}/signup?error=google_oauth_error`);
  }
  
  if (!code) {
    console.error("No authorization code received");
    return NextResponse.redirect(`${baseUrl}/signup?error=missing_code`);
  }
  
  try {
    console.log("Exchanging code for tokens...");
    
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${baseUrl}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("Token exchange failed:", errorData);
      throw new Error("Failed to exchange code for tokens");
    }
    
    const tokens = await tokenResponse.json();
    console.log("Tokens received successfully");
    
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });
    
    if (!userInfoResponse.ok) {
      throw new Error("Failed to fetch user info");
    }
    
    const googleUser = await userInfoResponse.json();
    console.log("Google user email:", googleUser.email);
    
    const response = NextResponse.redirect(`${baseUrl}/signup?google_signup=true`);
    
    response.cookies.set("google_user_email", googleUser.email, {
      path: "/",
      maxAge: 600,
      sameSite: "lax",
    });
    
    response.cookies.set("google_user_name", googleUser.name, {
      path: "/",
      maxAge: 600,
      sameSite: "lax",
    });
    
    if (googleUser.picture) {
      response.cookies.set("google_user_picture", googleUser.picture, {
        path: "/",
        maxAge: 600,
        sameSite: "lax",
      });
    }
    
    return response;
    
  } catch (err) {
    console.error("Callback error:", err);
    return NextResponse.redirect(`${baseUrl}/signup?error=callback_failed`);
  }
}