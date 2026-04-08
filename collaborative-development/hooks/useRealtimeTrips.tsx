// src/hooks/useRealtimeTrips.ts
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Trip {
  id: string;
  status: string;
  pickup_address?: string;
  delivery_charge: number;
  assigned_at: string;
  completed_at?: string | null;
  order_id?: string;
  supplier_id?: string;
  orders: {
    id: string;
    order_number: string;
    customer_name: string;
    customer_phone: string;
    total_amount: number;
    delivery_address: string;
    organizations: {
      name: string;
      address: string;
      phone: string;
    };
  };
}

export function useRealtimeTrips({ onNewTrip }: { onNewTrip: (trip: Trip) => void }) {
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel("trips-channel")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "driver_assignments",
        },
        async (payload) => {
          // Fetch full trip details
          const { data: fullTrip } = await supabase
            .from("driver_assignments")
            .select(`
              *,
              orders:order_id (
                *,
                organizations (*)
              )
            `)
            .eq("id", payload.new.id)
            .single();

          if (fullTrip) {
            onNewTrip(fullTrip);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [onNewTrip, supabase]);
}