// src/hooks/useRealtimeOrders.ts
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeOrders({ onNewOrder }: { onNewOrder: (order: any) => void }) {
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
  }, []);
}