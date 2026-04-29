"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import SupplierLayout from "@/components/layout/SupplierLayout";

export default function SupplierSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect suppliers away from settings
    router.push("/suppliers/orders");
  }, [router]);

  return (
    <SupplierLayout>
      <div>Redirecting...</div>
    </SupplierLayout>
  );
}
