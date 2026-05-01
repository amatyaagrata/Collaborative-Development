"use client";

import { useState, useRef, useEffect } from "react";
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

// Terms and Conditions Modal Component - FIXED (Hooks before conditional return)
function TermsModal({ isOpen, onClose, onAccept }: { isOpen: boolean; onClose: () => void; onAccept: () => void }) {
  // ✅ ALL hooks at the top level, BEFORE any conditional returns
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const handleScroll = () => {
    if (contentRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
      // Consider "bottom" when scrolled within 10px of the bottom
      const isAtBottom = scrollHeight - scrollTop - clientHeight < 10;
      if (isAtBottom && !hasScrolledToBottom) {
        setHasScrolledToBottom(true);
      }
    }
  };

  // Reset scroll state when modal opens
  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
      // Reset scroll position
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.scrollTop = 0;
        }
      }, 100);
    }
  }, [isOpen]);

  // ✅ Conditional return AFTER all hooks
  if (!isOpen) return null;

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
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 space-y-6 text-gray-700"
        >
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">1. Acceptance of Terms</h3>
            <p className="text-sm leading-relaxed">
              By requesting access to GoGodam's inventory management platform, you agree to be bound by these Terms and Conditions, 
              all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">2. Request Process</h3>
            <p className="text-sm leading-relaxed">
              Submitting a request does not guarantee access. All requests are reviewed by an administrator 
              who will verify your information before granting access to the platform.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">3. Account Security</h3>
            <p className="text-sm leading-relaxed">
              You are responsible for maintaining the security of your account and any actions that occur under your account. 
              You must notify GoGodam immediately of any unauthorized use of your account.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">4. Data Privacy</h3>
            <p className="text-sm leading-relaxed">
              GoGodam collects and processes your personal information as described in our Privacy Policy. 
              By using our service, you consent to such processing and warrant that all data provided by you is accurate.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">5. Acceptable Use</h3>
            <p className="text-sm leading-relaxed">
              You agree to use GoGodam only for lawful purposes and in a way that does not infringe the rights of, 
              restrict or inhibit anyone else's use of the platform.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">6. Termination</h3>
            <p className="text-sm leading-relaxed">
              GoGodam reserves the right to terminate or suspend access to our service immediately, without prior notice, 
              for conduct that violates these Terms or for other conduct deemed harmful to other users or the platform.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">7. Changes to Terms</h3>
            <p className="text-sm leading-relaxed">
              GoGodam reserves the right to modify or replace these Terms at any time. If a revision is material, 
              we will provide at least 30 days' notice prior to any new terms taking effect.
            </p>
          </div>

          <div className="space-y-4 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">8. Contact Information</h3>
            <p className="text-sm leading-relaxed">
              If you have any questions about these Terms, please contact us at legal@gogodam.com.
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
                ? "bg-primary hover:bg-[#4d00cc] text-white shadow-md hover:shadow-lg active:scale-[0.98] cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            I Accept the Terms
          </button>
        </div>
        
        {!hasScrolledToBottom && (
          <div className="px-6 pb-4 text-xs text-amber-600 text-center">
            📜 Please scroll to the bottom to accept the terms and conditions
          </div>
        )}
      </div>
    </div>
  );
}

export default function RequestAccess() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    phoneNumber: "",
    reason: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    name: "",
    phoneNumber: "",
    reason: "",
  });
  const [selectedRole, setSelectedRole] = useState("inventory manager");
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Validation functions
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return "Email is required";
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    if (email.length > 100) return "Email must be less than 100 characters";
    return "";
  };

  const validateName = (name: string) => {
    if (!name) return "Name is required";
    if (name.length < 2) return "Name must be at least 2 characters";
    if (name.length > 100) return "Name must be less than 100 characters";
    return "";
  };

  const validatePhoneNumber = (phone: string) => {
    if (!phone) return "";
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length > 0 && cleaned.length < 10) return "Phone number must be at least 10 digits";
    if (cleaned.length > 15) return "Phone number too long";
    return "";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
    } else if (name === "name") {
      setErrors({ ...errors, name: validateName(value) });
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
    const nameError = validateName(formData.name);
    const phoneError = validatePhoneNumber(formData.phoneNumber);

    setErrors({
      email: emailError,
      name: nameError,
      phoneNumber: phoneError,
      reason: "",
    });

    if (emailError) { toast.error(emailError); return false; }
    if (nameError) { toast.error(nameError); return false; }
    if (phoneError) { toast.error(phoneError); return false; }
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
      const response = await fetch("/api/auth/request-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          requested_role: selectedRole,
          phone: formData.phoneNumber,
          reason: formData.reason,
          terms_accepted: true,
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `Request failed`);
      }

      toast.success("Request submitted successfully!");
      setSubmitted(true);
    } catch (error: unknown) {
      console.error("[CLIENT] Request error:", error);
      toast.error(error instanceof Error ? error.message : "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
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
                  Join our platform
                </h2>
                <h1 className="text-3xl lg:text-4xl font-bold tracking-tight leading-[1.2] text-zinc-900">
                  Inventory, suppliers, and <br />
                  deliveries— <br />
                  <span className="text-primary">in one flow.</span>
                </h1>
                <p className="mt-6 text-base text-zinc-500 font-medium leading-relaxed max-w-md">
                  Request access to manage inventory and orders with a clean workflow.
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
                      REQUESTING ROLE
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
                  Request Access
                </h2>
                <p className="mt-2 text-sm text-zinc-400 font-medium">
                  Submit a request to join the platform.
                </p>
              </div>

              {submitted ? (
                <div className="mt-12 text-center py-10 bg-green-50 rounded-2xl border border-green-100">
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-green-800 mb-2">Request Submitted!</h3>
                  <p className="text-green-700 max-w-xs mx-auto">
                    Your request has been sent to the administrator. We will contact you once it is reviewed.
                  </p>
                  <Link href="/">
                    <Button className="mt-6 bg-white text-green-700 border border-green-200 hover:bg-green-50">
                      Return to Home
                    </Button>
                  </Link>
                </div>
              ) : (
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

                  {/* Full Name */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Full Name *
                    </label>
                    <div>
                      <Input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        required
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                          errors.name
                            ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                            : "border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        }`}
                      />
                      {errors.name && (
                        <p className="text-xs text-red-500 mt-1">{errors.name}</p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2.5">
                    <label className="text-[13px] font-bold text-zinc-900 flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Email Address *
                    </label>
                    <Input
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                      required
                      className="w-full px-4 py-3.5 rounded-xl border border-zinc-200 focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                    />
                    {errors.email && (
                      <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                    )}
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
                        className={`w-full px-4 py-3 rounded-xl border transition-all duration-300 ${
                          errors.phoneNumber
                            ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                            : "border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                        }`}
                      />
                      {errors.phoneNumber && (
                        <p className="text-xs text-red-500 mt-1">{errors.phoneNumber}</p>
                      )}
                    </div>
                  </div>

                  {/* Reason */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Reason for joining (Optional)
                    </label>
                    <div>
                      <textarea
                        name="reason"
                        value={formData.reason}
                        onChange={handleChange}
                        placeholder="Tell us a bit about your organization or why you need access"
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-300 font-medium text-sm text-gray-700 placeholder-gray-400 outline-none resize-y"
                      />
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="flex items-start gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="terms"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="w-4 h-4 text-primary border-zinc-300 rounded focus:ring-primary mt-1 cursor-pointer"
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
                        Submitting Request...
                      </span>
                    ) : (
                      "Submit Request"
                    )}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}