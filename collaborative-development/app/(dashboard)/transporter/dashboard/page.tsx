"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTrips } from "@/hooks/useRealtimeTrips";
import TripCard from "@/components/driver/trips/TripCard";
import { toast } from "sonner";
import type { Trip, TripStats } from "@/types/models";
import { Truck, CheckCircle, Navigation, Clock } from "lucide-react";
import styles from "@/components/layout/PortalLayout.module.css";
import { WelcomeMessage } from "@/components/shared/WelcomeMessage";

export default function TransporterDashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  const fetchTrips = useCallback(async (): Promise<Trip[]> => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];
    
    // Attempt to match driver_assignments to this user.
    // In a real flow, you'd match auth user -> profile -> driver/transporter record.
    const { data, error } = await supabase
      .from("driver_assignments")
      .select(`*, orders:order_id(id, order_number, customer_name, customer_phone, delivery_address, total_amount, organizations(name, address, phone))`)
      // Temporary: we don't have driver linking fully mapped in the SQL script, so we fetch all or just gracefully handle empty
      .order("assigned_at", { ascending: false });

    if (!error && data) return data as Trip[];
    return [];
  }, [supabase]);

  useEffect(() => {
    fetchTrips().then(data => { setTrips(data); setLoading(false); });
  }, [fetchTrips]);

  useRealtimeTrips({
    onNewTrip: (newTrip: Trip) => {
      toast.info(`New trip assigned to you!`, { duration: 10000 });
      setTrips(prev => [newTrip, ...prev]);
    }
  });

  async function updateTripStatus(tripId: string, status: string) {
    const { error } = await supabase.from("driver_assignments").update({ status, completed_at: status === "delivered" ? new Date().toISOString() : null }).eq("id", tripId);
    if (!error) { toast.success(`Trip status updated to ${status}`); fetchTrips().then(setTrips); }
  }

  const pendingTrips = trips.filter(t => t.status === "assigned" || t.status === "accepted");
  const activeTrips = trips.filter(t => t.status === "in_transit");
  const completedTrips = trips.filter(t => t.status === "delivered");

  // Fallback mock data for new stats
  const stats = {
    activeDeliveries: activeTrips.length,
    completedToday: completedTrips.length,
    totalMiles: 145,
    onTimeRate: "98.5%"
  };

  if (loading) return <><div className={styles.loadingState}>Loading dashboard...</div></>;

  return (
    <>
      <WelcomeMessage roleOverride="Driver/Transporter" />
      <div className={styles.pageStack}>
        <div className={styles.statsGrid}>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Truck size={16} color="#7c3aed"/><h3 className={styles.metricLabel}>Active Deliveries</h3></div>
            <p className={styles.metricValue}>{stats.activeDeliveries}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><CheckCircle size={16} color="#10b981"/><h3 className={styles.metricLabel}>Completed Today</h3></div>
            <p className={styles.metricValue}>{stats.completedToday}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Navigation size={16} color="#3b82f6"/><h3 className={styles.metricLabel}>Total Miles</h3></div>
            <p className={styles.metricValue}>{stats.totalMiles}</p>
          </div>
          <div className={styles.metricCard}>
            <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}><Clock size={16} color="#f59e0b"/><h3 className={styles.metricLabel}>On-Time Rate</h3></div>
            <p className={styles.metricValue}>{stats.onTimeRate}</p>
          </div>
        </div>

        {activeTrips.length > 0 && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>Active Deliveries</h2></div>
            <div className={styles.cardList}>
              {activeTrips.map((trip) => <TripCard key={trip.id} trip={trip} onComplete={() => updateTripStatus(trip.id, "delivered")} showActions={true} />)}
            </div>
          </div>
        )}

        {pendingTrips.length > 0 && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>Pending Deliveries</h2><span className={styles.topbarMeta}>{pendingTrips.length} trips</span></div>
            <div className={styles.cardList}>
              {pendingTrips.map((trip) => <TripCard key={trip.id} trip={trip} onAccept={() => updateTripStatus(trip.id, "accepted")} onReject={() => updateTripStatus(trip.id, "cancelled")} onComplete={() => updateTripStatus(trip.id, "in_transit")} showActions={true} />)}
            </div>
          </div>
        )}

        {completedTrips.length > 0 && (
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}><h2 className={styles.sectionTitle}>Recent Deliveries</h2><button className={styles.ghostButton} onClick={() => router.push("/transporter/deliveries")} type="button">View All →</button></div>
            <div className={styles.cardList}>
              {completedTrips.slice(0, 3).map((trip) => <TripCard key={trip.id} trip={trip} showActions={false} />)}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
