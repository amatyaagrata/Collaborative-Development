"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

const logo = "/assets/logo.png";

const roles = [
  { value: "admin", label: "Admin", description: "Full system access" },
  { value: "supplier", label: "Supplier", description: "Supply products to inventory" },
  { value: "transporter", label: "Transporter", description: "Manage transportation" },
  { value: "inventory manager", label: "Inventory Manager", description: "Manage products and stock" },
];

export default function SignUp() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    organizationName: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    username: "",
    organizationName: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
  });
  const [selectedRole, setSelectedRole] = useState("inventory manager");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  // Auto-fill Google user data when returning from Google OAuth
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
      return null;
    };

    const googleEmail = getCookie('google_user_email');
    const googleName = getCookie('google_user_name');

    if (googleEmail) {
      setFormData(prev => ({
        ...prev,
        email: googleEmail,
        username: googleName || prev.username,
      }));

      // Clear the cookies
      document.cookie = "google_user_email=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "google_user_name=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "google_user_picture=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      toast.success("Google account detected! Please complete your signup.");
    }
  }, []);

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    if (email.length > 100) return "Email must be less than 100 characters";
    return "";
  };

  const validateUsername = (username: string) => {
    if (!username) return "Username is required";
    if (username.length < 3) return "Username must be at least 3 characters";
    if (username.length > 30) return "Username must be less than 30 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return "Username can only contain letters, numbers, and underscores";
    return "";
  };

  const validateOrganizationName = (orgName: string) => {
    if (!orgName) return "Organization name is required";
    if (orgName.length < 2) return "Organization name must be at least 2 characters";
    if (orgName.length > 100) return "Organization name must be less than 100 characters";
    return "";
  };

  const validatePassword = (password: string) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    if (password.length > 50) return "Password must be less than 50 characters";

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return "Password must contain at least one uppercase letter, one lowercase letter, and one number";
    }

    return "";
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword) return "Please confirm your password";
    if (confirmPassword !== password) return "Passwords do not match";
    return "";
  };

  const validatePhoneNumber = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) return "Phone number must be at least 10 digits";
    if (cleaned.length > 15) return "Phone number must be less than 15 digits";
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }

    // Real-time validation
    if (name === "email") {
      setErrors({ ...errors, email: validateEmail(value) });
    } else if (name === "username") {
      setErrors({ ...errors, username: validateUsername(value) });
    } else if (name === "organizationName") {
      setErrors({ ...errors, organizationName: validateOrganizationName(value) });
    } else if (name === "password") {
      setErrors({
        ...errors,
        password: validatePassword(value),
        confirmPassword: formData.confirmPassword ? validateConfirmPassword(formData.confirmPassword, value) : "",
      });
    } else if (name === "confirmPassword") {
      setErrors({
        ...errors,
        confirmPassword: validateConfirmPassword(value, formData.password),
      });
    } else if (name === "phoneNumber") {
      setErrors({ ...errors, phoneNumber: validatePhoneNumber(value) });
    }
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedRole(e.target.value);
  };

  const validateForm = () => {
    const emailError = validateEmail(formData.email);
    const usernameError = validateUsername(formData.username);
    const orgNameError = validateOrganizationName(formData.organizationName);
    const passwordError = validatePassword(formData.password);
    const confirmPasswordError = validateConfirmPassword(formData.confirmPassword, formData.password);
    const phoneError = validatePhoneNumber(formData.phoneNumber);

    setErrors({
      email: emailError,
      username: usernameError,
      organizationName: orgNameError,
      password: passwordError,
      confirmPassword: confirmPasswordError,
      phoneNumber: phoneError,
    });

    if (emailError) {
      toast.error(emailError);
      return false;
    }
    if (usernameError) {
      toast.error(usernameError);
      return false;
    }
    if (orgNameError) {
      toast.error(orgNameError);
      return false;
    }
    if (passwordError) {
      toast.error(passwordError);
      return false;
    }
    if (confirmPasswordError) {
      toast.error(confirmPasswordError);
      return false;
    }
    if (phoneError) {
      toast.error(phoneError);
      return false;
    }
    if (!agreeToTerms) {
      toast.error("Please agree to the Terms and Services");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      console.log("[CLIENT] Calling /api/auth/signup endpoint...");
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: formData.username,
          role: selectedRole,
          phone: formData.phoneNumber,
          organization_name: formData.organizationName,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMsg = responseData.error || `Profile creation failed`;
        if (errorMsg.toLowerCase().includes("rate limit")) {
          throw new Error("Too many signup attempts. Please wait a few minutes and try again.");
        }
        throw new Error(errorMsg);
      }

      toast.success(`Account created as ${selectedRole}! Please check your email and log in.`);

      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (error: unknown) {
      console.error("[CLIENT] Signup error:", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Google Sign Up Handler
  const handleGoogleSignUp = () => {
    if (!agreeToTerms) {
      toast.error("Please agree to the Terms and Services before continuing with Google");
      return;
    }

    setGoogleLoading(true);

    // Store pending signup data in session storage
    sessionStorage.setItem("pendingSignUpRole", selectedRole);
    sessionStorage.setItem("pendingOrganizationName", formData.organizationName);
    sessionStorage.setItem("pendingPhoneNumber", formData.phoneNumber);
    sessionStorage.setItem("pendingUsername", formData.username);

    // Redirect to Google OAuth endpoint
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-primary/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-56 right-0 w-[600px] h-[600px] bg-[#1e004b]/10 blur-[120px] rounded-full" />
      </div>

      <div className="min-h-screen flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left Panel */}
          <div className="hidden lg:flex flex-col rounded-[32px] border border-zinc-100 bg-white shadow-sm p-10 lg:p-12 relative overflow-hidden">
            <Link href="/" className="flex items-center gap-3 w-fit">
              <div className="relative w-12 h-12">
                <Image src={logo} alt="GoGodam Logo" fill className="object-contain" />
              </div>
              <span className="text-2xl font-bold text-primary tracking-tighter">
                GoGodam
              </span>
            </Link>

            <div className="mt-14 flex flex-col">
              <h2 className="text-[22px] font-bold tracking-tight text-primary mb-4">
                Create your account
              </h2>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight leading-[1.2] text-zinc-900">
                Inventory, suppliers, and <br />
                deliveries— <br />
                <span className="text-primary">in one flow.</span>
              </h1>
              <p className="mt-6 text-base text-zinc-500 font-medium leading-relaxed max-w-md">
                Pick a role, add your organization, and start managing inventory and orders with a clean workflow.
              </p>
            </div>

            <div className="mt-12 space-y-4">
              {[
                "Track inventory in real-time",
                "Manage orders efficiently",
                "Generate reports & insights",
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 text-zinc-500 group cursor-default">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold">{feature}</span>
                </div>
              ))}
            </div>

            <div className="mt-12">
              <div className="p-7 rounded-2xl bg-zinc-50 border border-zinc-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-[0.1em]">
                    SIGNING UP AS
                  </span>
                </div>
                <p className="text-xl font-bold text-zinc-900 capitalize tracking-tight">
                  {selectedRole}
                </p>
                <p className="text-sm text-zinc-400 font-medium mt-2">
                  {roles.find((r) => r.value === selectedRole)?.description}
                </p>
              </div>
            </div>
          </div>

          {/* Right Panel (Form) */}
          <div className="rounded-[32px] border border-zinc-100 bg-white shadow-sm p-8 md:p-10">
            <div className="flex items-center justify-between gap-4">
              <Link href="/" className="flex items-center gap-2 lg:hidden">
                <div className="relative w-10 h-10">
                  <Image src={logo} alt="GoGodam Logo" fill className="object-contain" />
                </div>
                <span className="text-xl font-bold text-primary tracking-tighter">
                  GoGodam
                </span>
              </Link>
              <p className="text-sm text-zinc-400 font-medium">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-bold">
                  Sign in
                </Link>
              </p>
            </div>

            <div className="mt-8">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900">
                Sign up
              </h2>
              <p className="mt-2 text-sm text-zinc-400 font-medium">
                Create an account to start using GoGodam.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 mt-8">
              {/* Role Selector */}
              <div className="space-y-2.5">
                <label className="text-[13px] font-bold text-zinc-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Select Role *
                </label>

                <div className="relative">
                  <select
                    value={selectedRole}
                    onChange={handleRoleChange}
                    className="w-full px-4 py-3.5 rounded-xl border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none bg-white text-zinc-700 font-medium cursor-pointer"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none">
                    <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 font-medium pl-1">
                  {roles.find(r => r.value === selectedRole)?.description}
                </p>
              </div>

              {/* Email */}
              <div className="space-y-2.5">
                <label className="text-[13px] font-bold text-zinc-900 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email *
                </label>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email.."
                  required
                  className="w-full px-4 py-3.5 rounded-xl border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                />
              </div>

              {/* Username */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Username *
                </label>
                <div>
                  <Input
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your name here"
                    required
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${errors.username
                      ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      }`}
                  />
                  {errors.username && (
                    <p className="text-xs text-red-500 mt-1">{errors.username}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Username can contain letters, numbers, and underscores</p>
                </div>
              </div>

              {/* Organization Name */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Organization Name *
                </label>
                <div>
                  <Input
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleChange}
                    placeholder="Enter your organization/shop name"
                    required
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${errors.organizationName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      }`}
                  />
                  {errors.organizationName && (
                    <p className="text-xs text-red-500 mt-1">{errors.organizationName}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Password *
                </label>
                <div>
                  <div className="relative">
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 pr-12 ${errors.password
                        ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-primary transition-colors"
                    >
                      {showPassword ? "🔓" : "🔒"}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Password must be at least 6 characters with uppercase, lowercase, and numbers
                  </p>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Confirm Password *
                </label>
                <div>
                  <div className="relative">
                    <Input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      required
                      className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 pr-12 ${errors.confirmPassword
                        ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                        : "border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-primary transition-colors"
                    >
                      {showConfirmPassword ? "🔓" : "🔒"}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Phone Number (Optional)
                </label>
                <div>
                  <Input
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="+977-XXXXXXXXXX"
                    className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${errors.phoneNumber
                      ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                      : "border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      }`}
                  />
                  {errors.phoneNumber && (
                    <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">Enter a valid phone number (e.g., +977 1234567890)</p>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start gap-3 pt-2">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="w-4 h-4 text-primary border-zinc-300 rounded focus:ring-primary mt-1"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  By signing up you agree to GoGodam&apos;s{" "}
                  <button
                    type="button"
                    onClick={() => toast.info("Terms and Services will be shown here")}
                    className="text-primary hover:opacity-90 font-medium"
                  >
                    terms and services
                  </button>
                </label>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-primary hover:bg-[#4d00cc] text-white font-semibold py-3.5 px-4 rounded-2xl transition-all duration-200 active:scale-[0.99] shadow-sm shadow-primary/20 mt-4"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                ) : (
                  "Sign up & save"
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-zinc-500">or continue with</span>
              </div>
            </div>

            {/* Google Sign Up Button */}
            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={googleLoading}
              className="relative w-full group overflow-hidden rounded-2xl bg-white border border-zinc-200 hover:border-primary/40 transition-all duration-200 hover:shadow-sm"
            >
              <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>

              <div className="relative flex items-center justify-center gap-3 px-4 py-3">
                {googleLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="text-gray-700 font-medium">Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                    </svg>
                    <span className="text-zinc-700 font-medium group-hover:text-zinc-900 transition-colors duration-200">
                      Continue with Google
                    </span>
                    <svg className="w-4 h-4 text-zinc-400 group-hover:text-primary transition-all duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </div>
            </button>

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Welcome to our platform!</p>
                  <p>Please fill out the form above to create your account.</p>
                </div>
              </div>
            </div>

            {/* Login Link */}
            <div className="mt-4 text-center lg:hidden">
              <p className="text-sm text-zinc-600">
                Already have an account?{" "}
                <Link href="/login" className="text-primary font-semibold hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
