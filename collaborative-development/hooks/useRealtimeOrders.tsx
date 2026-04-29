// src/hooks/useRealtimeOrders.ts
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { SupplierOrder } from "@/types/models";

export function useRealtimeOrders({ onNewOrder }: { onNewOrder: (order: SupplierOrder) => void }) {
  const supabase = createClient();
  const callbackRef = useRef(onNewOrder);

  // Keep callback ref current without causing re-subscribes
  useEffect(() => {
    callbackRef.current = onNewOrder;
  }, [onNewOrder]);

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
            callbackRef.current(fullOrder as SupplierOrder);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);
}
