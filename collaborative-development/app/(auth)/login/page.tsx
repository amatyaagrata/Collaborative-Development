"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import Image from "next/image";

const logo = "/assets/logo.png";

interface OrgOption {
  id: string;
  name: string;
  role: string;
}

function LoginContent() {
  // State management for form inputs and loading status
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Password visibility state
  const [organizations, setOrganizations] = useState<OrgOption[]>([]);
  const [showOrgPicker, setShowOrgPicker] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  
  // Router instance for navigation after successful login
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('error') === 'pending') {
      toast.error("Your account is pending approval or lacks access rights.");
    }
  }, [searchParams]);
  
  // Create Supabase client for authentication
  const supabase = createClient();

  /**
   * Handles the login form submission
   * Authenticates user with Supabase and redirects based on their role
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission
    setLoading(true); // Show loading state on button

    try {
      console.log("[LOGIN] Starting login with email:", email);
      
      // Step 1: Authenticate user with Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // Handle authentication errors
      if (error) {
        console.error("[LOGIN] Auth signin error:", error);
        
        // Provide user-friendly error messages
        if (error.message.toLowerCase().includes("invalid") || error.message.toLowerCase().includes("not found")) {
          toast.error("Account not found. Please request access first or check your email.");
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      console.log("[LOGIN] Auth signin successful, checking organizations...");

      // Step 2: Check if user belongs to multiple organizations
      const orgsResponse = await fetch("/api/auth/user-role?orgs=true");
      
      let orgsData: any = {};
      const contentType = orgsResponse.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        orgsData = await orgsResponse.json();
      } else {
        const text = await orgsResponse.text();
        console.error("[LOGIN] Non-JSON response from user-role:", text);
        throw new Error(`Server returned an invalid response (${orgsResponse.status}). Please verify the server is running and try again.`);
      }

      if (orgsResponse.ok && orgsData.organizations && orgsData.organizations.length > 1) {
        // User belongs to multiple orgs — show picker
        console.log("[LOGIN] User has multiple orgs:", orgsData.organizations);
        setOrganizations(orgsData.organizations);
        setShowOrgPicker(true);
        setLoading(false);
        return;
      }

      // Single org or no org — proceed directly
      await completeLogin();
      
    } catch (error: unknown) {
      // Handle any unexpected errors
      console.error("[LOGIN] Unexpected error:", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  /**
   * Complete login by fetching role and redirecting
   */
  const completeLogin = async (orgId?: string) => {
    setLoading(true);
    try {
      const roleUrl = orgId
        ? `/api/auth/user-role?org_id=${orgId}`
        : "/api/auth/user-role";

      const roleResponse = await fetch(roleUrl);
      
      let roleData: any = {};
      const roleContentType = roleResponse.headers.get("content-type");
      if (roleContentType && roleContentType.includes("application/json")) {
        roleData = await roleResponse.json();
      } else {
        const text = await roleResponse.text();
        console.error("[LOGIN] Non-JSON response from user-role redirect check:", text);
        throw new Error(`Server returned an invalid response (${roleResponse.status}). Please check the console.`);
      }

      console.log("[LOGIN] Role data received:", roleData);

      // Handle role fetch errors
      if (!roleResponse.ok) {
        console.error("[LOGIN] Failed to fetch role:", roleData.error);
        toast.error("Failed to load user profile. Please try again.");
        setLoading(false);
        return;
      }

      // Get role and redirect path from response
      const { role, redirect } = roleData;
      console.log("[LOGIN] User role:", role, "Redirecting to:", redirect);

      // Show success message with user role
      const orgName = organizations.find(o => o.id === orgId)?.name;
      const successMsg = orgName
        ? `Welcome! Logged in as ${role} at ${orgName}`
        : `Welcome back! You are logged in as ${role}`;
      toast.success(successMsg);
      
      // Redirect to role-specific dashboard after short delay
      setTimeout(() => {
        router.push(redirect);
      }, 500);
    } catch (error) {
      console.error("[LOGIN] Unexpected error during redirect:", error);
      toast.error("Failed to complete login.");
      setLoading(false);
    }
  };

  /**
   * Handle organization selection
   */
  const handleOrgSelect = (orgId: string) => {
    setSelectedOrgId(orgId);
    setShowOrgPicker(false);
    completeLogin(orgId);
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Role color mapping for org picker badges
  const roleColors: Record<string, string> = {
    admin: "#7c3aed",
    supplier: "#f59e0b",
    transporter: "#10b981",
    "inventory manager": "#3b82f6",
    inventory_manager: "#3b82f6",
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-56 right-0 w-[600px] h-[600px] bg-[#1e004b]/10 blur-[120px] rounded-full" />
      </div>

      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">
          <div className="hidden lg:flex flex-col justify-center rounded-[32px] border border-zinc-100 bg-white/60 backdrop-blur p-10">
            <Link href="/" className="flex items-center gap-3 w-fit">
              <div className="relative w-11 h-11">
                <Image src={logo} alt="GoGodam Logo" fill className="object-contain" />
              </div>
              <span className="text-2xl font-bold text-primary tracking-tighter">
                GoGodam
              </span>
            </Link>

            <h1 className="mt-10 text-4xl font-extrabold tracking-tight leading-tight">
              Sign in and get back to work.
            </h1>
            <p className="mt-4 text-zinc-600 leading-relaxed max-w-md">
              Manage inventory, suppliers, and deliveries with role-based access and real-time updates.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-3 text-sm">
              <div className="rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-sm">
                <p className="font-semibold">Secure by role</p>
                <p className="text-zinc-600 mt-0.5">RLS policies by default</p>
              </div>
              <div className="rounded-2xl border border-zinc-100 bg-white px-4 py-3 shadow-sm">
                <p className="font-semibold">Fast navigation</p>
                <p className="text-zinc-600 mt-0.5">Dashboards per team</p>
              </div>
            </div>
          </div>

          <div className="rounded-[32px] border border-zinc-100 bg-white shadow-sm p-7 md:p-9">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 lg:hidden">
                <div className="relative w-10 h-10">
                  <Image src={logo} alt="GoGodam Logo" fill className="object-contain" />
                </div>
                <span className="text-xl font-bold text-primary tracking-tighter">
                  GoGodam
                </span>
              </Link>
              <p className="text-xs md:text-sm text-zinc-500">
                New here?{" "}
                <Link href="/signup" className="text-primary font-semibold hover:underline">
                  Request Access
                </Link>
              </p>
            </div>

            {/* ── Organization Picker ── */}
            {showOrgPicker ? (
              <div className="mt-6">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                  Choose Organization
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  You belong to multiple organizations. Choose which one to log into.
                </p>

                <div className="mt-6 space-y-3">
                  {organizations.map((org) => (
                    <button
                      key={org.id}
                      onClick={() => handleOrgSelect(org.id)}
                      disabled={loading}
                      className="w-full text-left"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        borderRadius: 16,
                        border: selectedOrgId === org.id ? "2px solid #7c3aed" : "1px solid #e2e8f0",
                        background: selectedOrgId === org.id ? "#f5f3ff" : "#fff",
                        cursor: loading ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                        opacity: loading ? 0.6 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.borderColor = "#7c3aed";
                          e.currentTarget.style.background = "#faf5ff";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (selectedOrgId !== org.id) {
                          e.currentTarget.style.borderColor = "#e2e8f0";
                          e.currentTarget.style.background = "#fff";
                        }
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                          width: 40, height: 40, borderRadius: 12,
                          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          color: "#fff", fontWeight: 700, fontSize: "1rem",
                        }}>
                          {org.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: "0.95rem", color: "#1a1a2e" }}>
                            {org.name}
                          </p>
                          <span style={{
                            fontSize: "0.72rem", fontWeight: 600,
                            padding: "2px 8px", borderRadius: 12,
                            background: `${roleColors[org.role] ?? "#6b7280"}15`,
                            color: roleColors[org.role] ?? "#6b7280",
                          }}>
                            {org.role.charAt(0).toUpperCase() + org.role.slice(1)}
                          </span>
                        </div>
                      </div>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => { setShowOrgPicker(false); setOrganizations([]); }}
                  className="mt-4 text-sm text-zinc-500 hover:text-zinc-700 transition-colors"
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 0" }}
                >
                  ← Back to login
                </button>
              </div>
            ) : (
              <>
                {/* ── Normal Login Form ── */}
                <div className="mt-6">
                  <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
                    Sign in
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600">
                    Use your email and password to continue.
                  </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email Input Field */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      {/* Email icon */}
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Address *
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email..."
                      required
                      className="w-full px-4 py-3 rounded-2xl border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200 bg-white"
                    />
                  </div>

                  {/* Password Input Field with Show/Hide Toggle */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      {/* Password icon */}
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      Password *
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="w-full px-4 py-3 rounded-2xl border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all duration-200 bg-white pr-12"
                      />
                      {/* Show/Hide Password Toggle Button */}
                      <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          // Eye Slash Icon (Hide password)
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          // Eye Icon (Show password)
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Forgot Password Link */}
                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => toast.info("Password reset link sent to your email")}
                      className="text-xs text-primary hover:opacity-90 font-medium transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>

                  {/* Submit Button - Sign In */}
                  <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-[#4d00cc] text-white font-semibold py-3.5 px-4 rounded-2xl transition-all duration-200 active:scale-[0.99] shadow-sm shadow-primary/20 mt-4"
                    disabled={loading}
                  >
                    {loading ? (
                      // Loading spinner state
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                </form>

                {/* Footer Note - Terms and Privacy Policy */}
                <p className="text-center text-xs text-zinc-500 mt-6">
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Auth() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin" /></div>}>
      <LoginContent />
    </Suspense>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
