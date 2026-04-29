import { useState, useEffect } from "react";
import { getSuppliers } from "@/lib/supabase/actions/supplierActions";

export interface Supplier {
  id: string;
  name: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
  }>;
}

export function useSuppliers() {
  const [data, setData] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const suppliers = await getSuppliers();
        setData(suppliers as Supplier[] || []);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError(String(err));
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const refetch = async () => {
    try {
      setLoading(true);
      const suppliers = await getSuppliers();
      setData(suppliers as Supplier[] || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}
