import { useState, useEffect } from "react";
import { getProducts } from "@/lib/supabase/actions/productActions";

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  min_stock_level: number;
  category_id?: string;
  supplier_id?: string;
  created_at: string;
  updated_at: string;
  suppliers?: {
    id: string;
    name: string;
    contact_email: string;
    contact_phone?: string;
  };
  categories?: {
    id: string;
    name: string;
    description?: string;
  };
}

export function useProducts() {
  const [data, setData] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const products = await getProducts();
        setData(products as Product[] || []);
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
      const products = await getProducts();
      setData(products as Product[] || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}
