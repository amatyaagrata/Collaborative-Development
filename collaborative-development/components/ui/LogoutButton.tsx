"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error logging out");
      return;
    }
    toast.success("Logged out successfully");
    router.push("/login");
    router.refresh();
  };

  return (
    <button 
      onClick={handleLogout}
      className="flex items-center gap-2 px-3 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full text-left font-medium"
      title="Logout"
    >
      <LogOut size={20} />
      <span className="hidden md:inline">Logout</span>
    </button>
  );
}
