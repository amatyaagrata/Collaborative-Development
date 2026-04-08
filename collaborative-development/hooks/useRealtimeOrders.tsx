// src/hooks/useRealtimeOrders.ts
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Order {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  delivery_address: string;
  total_amount: number;
  supplier_id: string;
  items_count?: number;
  order_items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
  organizations: {
    name: string;
    address: string;
    phone: string;
  };
}

export function useRealtimeOrders({ onNewOrder }: { onNewOrder: (order: Order) => void }) {
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("orders-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "orders",
        },
        async (payload) => {
          // Fetch full order details with relations
          const { data: fullOrder } = await supabase
            .from("orders")
            .select(`
              *,
              order_items (*),
              organizations (name, address, phone)
            `)
            .eq("id", payload.new.id)
            .single();

          if (fullOrder) {
            onNewOrder(fullOrder);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewOrder, supabase]);
}