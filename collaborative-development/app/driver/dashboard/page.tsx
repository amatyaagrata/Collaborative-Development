// src/app/driver/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTrips } from "@/hooks/useRealtimeTrips";
import DriverLayout from "@/components/layout/DriverLayout";
import TripCard from "@/components/driver/trips/TripCard";
import { toast } from "sonner";
import type { Trip, TripStats } from "@/types/models";
import styles from "@/components/layout/PortalLayout.module.css";


export default function DriverDashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  const computeStats = (tripsData: Trip[]): TripStats => {
    const completed = tripsData.filter(t => t.status === "delivered");
    const totalEarnings = completed.reduce((sum, trip) => sum + (trip.delivery_charge || 0), 0);
    
    return {
      totalTrips: tripsData.length,
      completedTrips: completed.length,
      totalEarnings: totalEarnings,
      pendingTrips: tripsData.filter(t => t.status === "assigned" || t.status === "accepted").length,
    };
  };

  const stats = useMemo(() => computeStats(trips), [trips]);

  const fetchTrips = useCallback(async (): Promise<Trip[]> => {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("driver_assignments")
      .select(`
        *,
        orders:order_id (
          id,
          order_number,
          customer_name,
          customer_phone,
          delivery_address,
          total_amount,
          organizations (
            name,
            address,
            phone
          )
        )
      `)
      .eq("driver_id", userData.user?.id)
      .order("assigned_at", { ascending: false });

    if (!error && data) {
      return data as Trip[];
    }
    return [];
  }, [supabase]);

  useEffect(() => {
    const loadTrips = async () => {
      const data = await fetchTrips();
      setTrips(data);
      setLoading(false);
    };
    loadTrips();
  }, [fetchTrips]);

  // Real-time trip assignment subscription
  useRealtimeTrips({
    onNewTrip: (newTrip: Trip) => {
      toast.info(`New trip assigned to you!`, {
        duration: 10000,
        action: {
          label: "View Trip",
          onClick: () => router.push(`/driver/trips/${newTrip.id}`)
        }
      });
      
      setTrips(prev => [newTrip, ...prev]);
    }
  });

  async function updateTripStatus(tripId: string, status: string) {
    const { error } = await supabase
      .from("driver_assignments")
      .update({ 
        status: status,
        completed_at: status === "delivered" ? new Date().toISOString() : null
      })
      .eq("id", tripId);

    if (!error) {
      toast.success(`Trip status updated to ${status}`);
      const updatedTrips = await fetchTrips();
      setTrips(updatedTrips);
    }
  }

  const pendingTrips = trips.filter(t => t.status === "assigned" || t.status === "accepted");
  const activeTrips = trips.filter(t => t.status === "in_transit");
  const completedTrips = trips.filter(t => t.status === "delivered");

  if (loading) {
    return <div className="loading-spinner">Loading dashboard...</div>;
  }

  return (
    <DriverLayout>
      <div className={styles.pageStack}>
        <div className={styles.heroCard}>
          <h1 className={styles.heroTitle}>Transporter Dashboard</h1>
          <p className={styles.heroText}>Track assigned deliveries, confirm pickups, and keep a clear view of your earnings.</p>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.metricCard}>
            <h3 className={styles.metricLabel}>Total Trips</h3>
            <p className={styles.metricValue}>{stats.totalTrips}</p>
          </div>
          <div className={styles.metricCard}>
            <h3 className={styles.metricLabel}>Completed</h3>
            <p className={styles.metricValue}>{stats.completedTrips}</p>
          </div>
          <div className={styles.metricCard}>
            <h3 className={styles.metricLabel}>Pending</h3>
            <p className={styles.metricValue}>{stats.pendingTrips}</p>
          </div>
          <div className={styles.metricCard}>
            <h3 className={styles.metricLabel}>Total Earnings</h3>
            <p className={styles.metricValue}>Rs. {stats.totalEarnings.toLocaleString()}</p>
          </div>
        </div>

        {/* Pending Trips Section */}
        {pendingTrips.length > 0 && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Pending Trips</h2>
              <span className={styles.topbarMeta}>{pendingTrips.length} trips</span>
            </div>
            <div className={styles.cardList}>
              {pendingTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onAccept={() => updateTripStatus(trip.id, "accepted")}
                  onReject={() => updateTripStatus(trip.id, "cancelled")}
                  onComplete={() => updateTripStatus(trip.id, "in_transit")}
                  showActions={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Active Trips Section */}
        {activeTrips.length > 0 && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Active Trips</h2>
            </div>
            <div className={styles.cardList}>
              {activeTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onComplete={() => updateTripStatus(trip.id, "delivered")}
                  showActions={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recent Completed Trips */}
        {completedTrips.length > 0 && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Recent Deliveries</h2>
              <button
                className={styles.ghostButton}
                onClick={() => router.push("/driver/trips")}
                type="button"
              >
                View All →
              </button>
            </div>
            <div className={styles.cardList}>
              {completedTrips.slice(0, 3).map((trip) => (
                <TripCard key={trip.id} trip={trip} showActions={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    </DriverLayout>
  );
}
