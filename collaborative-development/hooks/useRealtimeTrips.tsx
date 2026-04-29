// src/hooks/useRealtimeTrips.ts
import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Trip } from "@/types/models";

export function useRealtimeTrips({ onNewTrip }: { onNewTrip: (trip: Trip) => void }) {
  const supabase = createClient();
  const callbackRef = useRef(onNewTrip);

  // Keep callback ref current without causing re-subscribes
  useEffect(() => {
    callbackRef.current = onNewTrip;
  }, [onNewTrip]);

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
            callbackRef.current(fullTrip as Trip);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);
}
