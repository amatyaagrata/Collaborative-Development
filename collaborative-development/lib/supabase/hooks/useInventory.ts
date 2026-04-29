import { useState, useEffect } from "react";
import { getInventory } from "@/lib/supabase/actions/inventoryActions";

interface InventoryProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  min_stock_level: number;
  suppliers?: {
    id: string;
    name: string;
  } | null;
  categories?: {
    id: string;
    name: string;
  } | null;
}

export interface InventoryItem extends InventoryProduct {
  // Inventory-specific computed fields
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock';
  total_value: number;
}

export function useInventory() {
  const [data, setData] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const products = await getInventory();

        // Transform products to inventory items with computed fields
        const inventoryItems: InventoryItem[] = (products as unknown as InventoryProduct[]).map(product => ({
          ...product,
          stock_status: product.stock === 0 ? 'out_of_stock' :
                       product.stock <= (product.min_stock_level || 0) ? 'low_stock' : 'in_stock',
          total_value: product.price * product.stock
        }));

        setData(inventoryItems);
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
      const products = await getInventory();

      const inventoryItems: InventoryItem[] = (products as unknown as InventoryProduct[]).map(product => ({
        ...product,
        stock_status: product.stock === 0 ? 'out_of_stock' :
                     product.stock <= (product.min_stock_level || 0) ? 'low_stock' : 'in_stock',
        total_value: product.price * product.stock
      }));

      setData(inventoryItems);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}
