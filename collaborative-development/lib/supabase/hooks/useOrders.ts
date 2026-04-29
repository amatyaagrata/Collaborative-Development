import { useState, useEffect } from "react";
import { getOrders } from "@/lib/supabase/actions/orderActions";

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  products?: {
    id: string;
    name: string;
    price: number;
  };
}

export interface Order {
  id: string;
  user_id: string;
  total_amount: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready_for_delivery' | 'out_for_delivery' | 'delivered' | 'cancelled';
  created_at: string;
  updated_at: string;
  users?: {
    id: string;
    name: string;
    email: string;
  };
  order_items?: OrderItem[];
  deliveries?: {
    id: string;
    status: string;
    delivery_date?: string;
    tracking_number?: string;
  }[];
}

export function useOrders() {
  const [data, setData] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const orders = await getOrders();
        setData(orders as Order[] || []);
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
      const orders = await getOrders();
      setData(orders as Order[] || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, refetch };
}
