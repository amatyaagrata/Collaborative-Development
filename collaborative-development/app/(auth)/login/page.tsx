"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Image from "next/image";

const logo = "/assets/logo.png";

export default function LoginPage() {
  // State management for form inputs and loading status
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Router instance for navigation after successful login
  const router = useRouter();
  
  // Create Supabase client for authentication
  const supabase = createClient();

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Handles the login form submission
   * Authenticates user with Supabase and redirects based on their role
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }
    
    setLoading(true);

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
        if (error.message.toLowerCase().includes("invalid credentials")) {
          toast.error("Invalid email or password. Please try again.");
        } else if (error.message.toLowerCase().includes("email not confirmed")) {
          toast.error("Please verify your email address before logging in.");
        } else {
          toast.error(error.message);
        }
        setLoading(false);
        return;
      }

      console.log("[LOGIN] Auth signin successful, fetching user role...");

      // Step 2: Fetch user role from our API to determine dashboard redirect
      const roleResponse = await fetch("/api/auth/user-role");
      const roleData = await roleResponse.json();

      console.log("[LOGIN] Role data received:", roleData);

      // Handle role fetch errors
      if (!roleResponse.ok) {
        console.error("[LOGIN] Failed to fetch role:", roleData.error);
        toast.error("Failed to load user profile. Please try again.");
        setLoading(false);
        return;
      }

      // Step 3: Get role and redirect path from response
      const { role, redirect } = roleData;
      console.log("[LOGIN] User role:", role, "Redirecting to:", redirect);

      // Show success message with user role
      toast.success(`Welcome back! You are logged in as ${role}`);
      
      // Step 4: Redirect to role-specific dashboard after short delay
      setTimeout(() => {
        router.push(redirect);
      }, 500);
      
    } catch (error: unknown) {
      // Handle any unexpected errors
      console.error("[LOGIN] Unexpected error:", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred");
      setLoading(false);
    }
  };

  // Don't render on server to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-indigo-50 px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse delay-2000"></div>
      </div>

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/20 transform transition-all duration-500 hover:scale-[1.02]">
          
          {/* Logo and Header Section */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <Link href="/" className="relative h-16 w-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 p-0.5 transition-transform hover:scale-110 duration-300">
              <div className="relative h-full w-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                <Image 
                  src={logo} 
                  alt="GoGodam Logo" 
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
            </Link>
            
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              GoGodam
            </h1>
            
            <p className="text-gray-500 text-sm">
              Welcome back! Please sign in to your account
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Input Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Email Address *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email..."
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 outline-none"
              />
            </div>

            {/* Password Input Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Password *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 pr-12 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-purple-600 transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500">Password must be at least 6 characters</p>
            </div>

            {/* Forgot Password Link */}
            <div className="text-right">
              <button
                type="button"
                onClick={() => toast.info("Password reset link will be sent to your email")}
                className="text-xs text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
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
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?
              <Link href="/signup" className="text-purple-600 font-semibold hover:text-purple-700 hover:underline transition-all ml-1">
                Sign Up
              </Link>
            </p>
          </div>

          {/* Footer Note */}
          <p className="text-center text-xs text-gray-500 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}