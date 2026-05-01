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
  { value: "supplier", label: "Supplier", description: "Supply products to inventory" },
  { value: "transporter", label: "Transporter", description: "Manage transportation" },
  { value: "inventory manager", label: "Inventory Manager", description: "Manage products and stock" },
];

// Terms and Conditions Modal Component
function TermsModal({ isOpen, onClose, onAccept }: { isOpen: boolean; onClose: () => void; onAccept: () => void }) {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  if (!isOpen) return null;

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const bottom = target.scrollHeight - target.scrollTop === target.clientHeight;
    setScrollPosition(target.scrollTop);
    if (bottom) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-primary">Terms and Conditions</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div 
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6 text-gray-700"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">1. Acceptance of Terms</h3>
            <p className="text-sm leading-relaxed">
              By accessing and using GoGodam's inventory management platform, you agree to be bound by these Terms and Conditions, 
              all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws. 
              If you do not agree with any of these terms, you are prohibited from using or accessing this site.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">2. Use License</h3>
            <p className="text-sm leading-relaxed">
              Permission is granted to temporarily use GoGodam's platform for personal, business, or commercial inventory management purposes. 
              This license does not include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose outside the intended use</li>
              <li>Attempting to decompile or reverse engineer any software contained on GoGodam's platform</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">3. User Account Responsibilities</h3>
            <p className="text-sm leading-relaxed">
              You are responsible for maintaining the confidentiality of your account credentials and for all activities 
              that occur under your account. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain and promptly update your account information</li>
              <li>Notify GoGodam immediately of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
              <li>Ensure that you log out from your account at the end of each session</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">4. Data Privacy and Security</h3>
            <p className="text-sm leading-relaxed">
              GoGodam collects and processes personal data in accordance with our Privacy Policy. By using our platform, 
              you consent to such processing and warrant that all data provided by you is accurate. We implement industry-standard 
              security measures to protect your data, including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>End-to-end encryption for sensitive data</li>
              <li>Regular security audits and penetration testing</li>
              <li>Multi-factor authentication options</li>
              <li>Automated backup systems</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">5. Platform Limitations</h3>
            <p className="text-sm leading-relaxed">
              While GoGodam strives for 99.9% uptime, we do not warrant that:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>The platform will function uninterrupted, secure, or available at any particular time or location</li>
              <li>Any errors or defects will be corrected</li>
              <li>The results of using the platform will meet your requirements or expectations</li>
              <li>Data loss or corruption will not occur</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">6. Fair Usage Policy</h3>
            <p className="text-sm leading-relaxed">
              To ensure optimal performance for all users, GoGodam implements fair usage policies. Excessive usage that 
              negatively impacts other users may result in temporary restrictions. Normal business operations including:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-sm">
              <li>Inventory management with up to 100,000 products</li>
              <li>Order processing with up to 10,000 monthly transactions</li>
              <li>API calls up to 10,000 per day</li>
              <li>User accounts up to 50 per organization</li>
            </ul>
            <p className="text-sm leading-relaxed mt-2">
              are considered within acceptable limits. Higher volumes may require a custom enterprise plan.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">7. Payment Terms</h3>
            <p className="text-sm leading-relaxed">
              For paid plans, subscription fees are billed in advance on a monthly or annual basis. Payments are non-refundable 
              except as required by law. Late payments may result in temporary suspension of access. We reserve the right to 
              change our pricing at any time with 30 days' notice.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">8. Termination</h3>
            <p className="text-sm leading-relaxed">
              GoGodam may terminate or suspend your access immediately, without prior notice or liability, for any reason whatsoever, 
              including without limitation if you breach the Terms. Upon termination, your right to use the platform will immediately cease. 
              All provisions of the Terms which by their nature should survive termination shall survive termination.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">9. Limitation of Liability</h3>
            <p className="text-sm leading-relaxed">
              In no event shall GoGodam or its suppliers be liable for any damages (including, without limitation, damages for loss of data 
              or profit, or due to business interruption) arising out of the use or inability to use the platform, even if GoGodam or an 
              authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">10. Modifications to Terms</h3>
            <p className="text-sm leading-relaxed">
              GoGodam may revise these terms of service for its platform at any time without notice. By using this platform, you agree to be 
              bound by the current version of these Terms and Conditions. We will notify users of material changes via email or platform notification.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">11. Governing Law</h3>
            <p className="text-sm leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws of [Your Country/State] and you irrevocably 
              submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">12. Contact Information</h3>
            <p className="text-sm leading-relaxed">
              For any questions regarding these Terms and Conditions, please contact us at:
            </p>
            <ul className="list-none space-y-1 text-sm">
              <li>Email: legal@gogodam.com</li>
              <li>Phone: [Your Phone Number]</li>
              <li>Address: [Your Business Address]</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
            <p className="text-sm text-blue-800">
              <strong>Last Updated:</strong> December 1, 2024<br />
              <strong>Version:</strong> 2.0<br />
              By accepting these terms, you enter into a legally binding agreement with GoGodam.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-between items-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-gray-600 hover:text-gray-800 font-medium transition-colors"
          >
            Decline
          </button>
          <button
            onClick={onAccept}
            disabled={!hasScrolledToBottom}
            className={`px-6 py-2.5 rounded-xl font-semibold transition-all duration-200 ${
              hasScrolledToBottom
                ? "bg-primary hover:bg-[#4d00cc] text-white shadow-md hover:shadow-lg active:scale-[0.98]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            I Accept the Terms
          </button>
        </div>
        {!hasScrolledToBottom && (
          <div className="px-6 pb-4 text-xs text-amber-600 text-center">
            Please scroll to the bottom to accept the terms and conditions
          </div>
        )}
      </div>
    </div>
  );
}

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
  const [showTermsModal, setShowTermsModal] = useState(false);

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

  const handleAcceptTerms = () => {
    setAgreeToTerms(true);
    setShowTermsModal(false);
    toast.success("Thank you for accepting the terms and conditions");
  };

  const openTermsModal = () => {
    setShowTermsModal(true);
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
      toast.error("Please read and accept the Terms and Conditions to continue");
      setShowTermsModal(true);
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
          termsAccepted: true,
          termsAcceptedAt: new Date().toISOString(),
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
      toast.error("Please read and accept the Terms and Conditions before continuing with Google");
      setShowTermsModal(true);
      return;
    }

    setGoogleLoading(true);

    // Store pending signup data in session storage
    sessionStorage.setItem("pendingSignUpRole", selectedRole);
    sessionStorage.setItem("pendingOrganizationName", formData.organizationName);
    sessionStorage.setItem("pendingPhoneNumber", formData.phoneNumber);
    sessionStorage.setItem("pendingUsername", formData.username);
    sessionStorage.setItem("termsAccepted", "true");

    // Redirect to Google OAuth endpoint
    window.location.href = "/api/auth/google";
  };

  return (
    <>
      <TermsModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
        onAccept={handleAcceptTerms} 
      />
      
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
                    I have read and agree to GoGodam&apos;s{" "}
                    <button
                      type="button"
                      onClick={openTermsModal}
                      className="text-primary hover:opacity-90 font-medium hover:underline"
                    >
                      Terms and Conditions
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
    </>
  );
}