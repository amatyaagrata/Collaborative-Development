// src/app/driver/dashboard/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeTrips } from "@/hooks/useRealtimeTrips";
import DriverLayout from "@/components/layout/DriverLayout";
import TripCard from "@/components/driver/trips/TripCard";
import { toast } from "sonner";

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

interface TripStats {
  totalTrips: number;
  completedTrips: number;
  totalEarnings: number;
  pendingTrips: number;
}

export default function DriverDashboard() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [stats, setStats] = useState<TripStats>({
    totalTrips: 0,
    completedTrips: 0,
    totalEarnings: 0,
    pendingTrips: 0,
  });
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();
  const router = useRouter();

  function calculateStats(tripsData: Trip[]) {
    const completed = tripsData.filter(t => t.status === "delivered");
    const totalEarnings = completed.reduce((sum, trip) => sum + (trip.delivery_charge || 0), 0);
    
    setStats({
      totalTrips: tripsData.length,
      completedTrips: completed.length,
      totalEarnings: totalEarnings,
      pendingTrips: tripsData.filter(t => t.status === "assigned" || t.status === "accepted").length,
    });
  }

  const fetchTrips = useCallback(async () => {
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
      setTrips(data as Trip[]);
      calculateStats(data as Trip[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchTrips();
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

  useEffect(() => {
    calculateStats(trips);
  }, [trips]);

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
      fetchTrips();
    }
  }

  const pendingTrips = trips.filter(t => t.status === "assigned" || t.status === "accepted");
  const activeTrips = trips.filter(t => t.status === "picked_up");
  const completedTrips = trips.filter(t => t.status === "delivered");

  if (loading) {
    return <div className="loading-spinner">Loading dashboard...</div>;
  }

  return (
    <DriverLayout>
      <div className="driver-dashboard">
        <div className="dashboard-header">
          <h1>Driver Dashboard</h1>
          <p>Manage your deliveries and track earnings</p>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Trips</h3>
            <p className="stat-value">{stats.totalTrips}</p>
          </div>
          <div className="stat-card">
            <h3>Completed</h3>
            <p className="stat-value">{stats.completedTrips}</p>
          </div>
          <div className="stat-card">
            <h3>Pending</h3>
            <p className="stat-value">{stats.pendingTrips}</p>
          </div>
          <div className="stat-card">
            <h3>Total Earnings</h3>
            <p className="stat-value">Rs. {stats.totalEarnings.toLocaleString()}</p>
          </div>
        </div>

        {/* Pending Trips Section */}
        {pendingTrips.length > 0 && (
          <div className="trips-section">
            <div className="section-header">
              <h2>Pending Trips</h2>
              <span className="count">{pendingTrips.length} trips</span>
            </div>
            <div className="trips-list">
              {pendingTrips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onAccept={() => updateTripStatus(trip.id, "accepted")}
                  onReject={() => updateTripStatus(trip.id, "rejected")}
                  showActions={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Active Trips Section */}
        {activeTrips.length > 0 && (
          <div className="trips-section">
            <div className="section-header">
              <h2>Active Trips</h2>
            </div>
            <div className="trips-list">
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
          <div className="trips-section">
            <div className="section-header">
              <h2>Recent Deliveries</h2>
              <button onClick={() => router.push("/driver/trips")}>
                View All →
              </button>
            </div>
            <div className="trips-list">
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