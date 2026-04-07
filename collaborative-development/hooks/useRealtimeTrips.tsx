// src/hooks/useRealtimeTrips.ts
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function useRealtimeTrips({ onNewTrip }: { onNewTrip: (trip: any) => void }) {
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
  }, []);
}