"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

const logo = "/assets/logo.png";

export default function RegisterOrganization() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    organizationName: "",
    password: "",
    confirmPassword: "",
  });

  const [otpSent, setOtpSent] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const handleSendOTP = async () => {
    const emailError = validateEmail(formData.email);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to send code");

      setOtpSent(true);
      toast.success("Verification code sent to your email!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length < 6) {
      toast.error("Please enter the verification code");
      return;
    }

    setOtpLoading(true);
    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, token: otpCode }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Verification failed");

      setIsEmailVerified(true);
      toast.success("Email verified successfully!");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEmailVerified) {
      toast.error("Please verify your email address first.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: "admin",
          organization_name: formData.organizationName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      toast.success("Organization and Admin account created successfully!");
      router.push("/login");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-56 right-0 w-[600px] h-[600px] bg-[#1e004b]/10 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-md bg-white rounded-[32px] border border-zinc-100 shadow-sm p-8 md:p-10">
        <div className="flex flex-col items-center mb-8">
          <Link href="/" className="flex items-center gap-2 mb-6">
            <div className="relative w-10 h-10">
              <Image src={logo} alt="GoGodam Logo" fill className="object-contain" />
            </div>
            <span className="text-xl font-bold text-primary tracking-tighter">GoGodam</span>
          </Link>
          <h1 className="text-2xl font-bold text-zinc-900">Create Your Organization</h1>
          <p className="text-sm text-zinc-400 font-medium mt-2">Sign up as an organization admin</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-zinc-900">Full Name *</label>
            <Input
              required
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-zinc-900">Email Address *</label>
            <div className="relative">
              <Input
                type="email"
                required
                disabled={otpSent || isEmailVerified}
                placeholder="admin@organization.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full px-4 py-3.5 rounded-xl border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium ${isEmailVerified ? "bg-green-50 border-green-200 pr-10" : ""}`}
              />
              {isEmailVerified && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {!isEmailVerified && !otpSent && (
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={otpLoading}
                className="text-xs font-bold text-primary hover:underline"
              >
                {otpLoading ? "Sending..." : "Send Verification Code"}
              </button>
            )}

            {otpSent && !isEmailVerified && (
              <div className="mt-2 p-3 bg-zinc-50 rounded-xl border border-zinc-200 space-y-2">
                <Input
                  maxLength={8}
                  placeholder="Enter Code"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  className="text-center tracking-widest font-bold px-4 py-3.5 rounded-xl border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
                <Button
                  type="button"
                  onClick={handleVerifyOTP}
                  disabled={otpLoading}
                  className="w-full bg-primary"
                >
                  {otpLoading ? "Verifying..." : "Verify Code"}
                </Button>
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-[10px] text-zinc-400 hover:text-primary underline block text-center w-full"
                >
                  Change email
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-zinc-900">Organization Name *</label>
            <Input
              required
              placeholder="Your Company Ltd."
              value={formData.organizationName}
              onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-zinc-900">Password *</label>
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-zinc-900">Confirm Password *</label>
            <Input
              type="password"
              required
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="w-full px-4 py-3.5 rounded-xl border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !isEmailVerified}
            className={`w-full py-6 rounded-2xl font-bold mt-4 ${
              !isEmailVerified ? "bg-zinc-100 text-zinc-400 shadow-none" : "bg-primary text-white"
            }`}
          >
            {loading ? "Creating Account..." : "Create Organization \u0026 Admin Account"}
          </Button>

          <p className="text-center text-sm text-zinc-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-primary font-bold">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
