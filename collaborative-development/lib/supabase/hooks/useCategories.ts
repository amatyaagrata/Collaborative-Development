import { useState, useEffect } from "react";
import { getCategories } from "@/lib/supabase/actions/categoryActions";

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
  }>;
  product_count?: number;
  total_value?: number;
}

export function useCategories() {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const categories = await getCategories();

        // Calculate product count and total value for each category
        const categoriesWithStats: Category[] = categories.map(category => ({
          ...category,
          product_count: category.products?.length || 0,
          total_value: category.products?.reduce((sum: number, product: { price: number; stock: number }) => sum + (product.price * product.stock), 0) || 0
        }));

        setData(categoriesWithStats);
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
      const categories = await getCategories();

      const categoriesWithStats: Category[] = categories.map(category => ({
        ...category,
        product_count: category.products?.length || 0,
        total_value: category.products?.reduce((sum: number, product: { price: number; stock: number }) => sum + (product.price * product.stock), 0) || 0
      }));

      setData(categoriesWithStats);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}
