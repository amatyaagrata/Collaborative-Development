import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useInventory() {
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const { data: inventory, error } = await supabase
          .from("inventory")
          .select("*")
          .order("updated_at", { ascending: false });
        if (error) throw error;
        setData(inventory || []);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError(String(err));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase]);

  return { data, loading, error };
}
