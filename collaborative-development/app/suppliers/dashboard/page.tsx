// src/app/supplier/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRealtimeOrders } from "@/hooks/useRealtimeOrders";
import { useNotifications } from "@/hooks/useNotifications";
import SupplierLayout from "@/components/layout/SupplierLayout";
import OrderCard from "@/components/supplier/orders/OrderCard";
import StatsCards from "@/components/supplier/dashboard/StatsCards";
import { toast } from "sonner";

export default function SupplierDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    completedOrders: 0,
  });
  
  const supabase = createClient();
  const router = useRouter();
  const { sendNotification } = useNotifications();

  // Fetch initial orders
  useEffect(() => {
    fetchOrders();
  }, []);

  // Real-time order subscription
  useRealtimeOrders({
    onNewOrder: (newOrder) => {
      // Stage 1: Show notification
      toast.info("You have received new orders. Please check your dashboard.", {
        duration: 5000,
        action: {
          label: "View",
          onClick: () => router.push(`/supplier/orders/${newOrder.id}`)
        }
      });

      // Save notification to database
      sendNotification({
        title: "New Order Received",
        message: `Order #${newOrder.order_number} - ${newOrder.items_count} items`,
        type: "order"
      });

      // Add to orders list
      setOrders(prev => [newOrder, ...prev]);
      updateStats();
      
      // Start escalation timer
      startEscalationTimer(newOrder);
    }
  });

  async function fetchOrders() {
    const { data: userData } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        order_items (quantity, product_name),
        organizations (name, address, phone)
      `)
      .eq("supplier_id", userData.user?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data);
      calculateStats(data);
    }
    setLoading(false);
  }

  function calculateStats(ordersData: any[]) {
    setStats({
      totalOrders: ordersData.length,
      pendingOrders: ordersData.filter(o => o.status === "pending").length,
      completedOrders: ordersData.filter(o => o.status === "delivered").length,
    });
  }

  function updateStats() {
    calculateStats(orders);
  }

  function startEscalationTimer(order: any) {
    // Stage 1: After 2 minutes, send "See your dashboard immediately"
    setTimeout(() => {
      checkOrderStatus(order.id, order.supplier_id);
    }, 2 * 60 * 1000);
  }

  async function checkOrderStatus(orderId: string, supplierId: string) {
    const { data: order } = await supabase
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();

    if (order?.status === "pending") {
      // Stage 2: Send alert message
      toast.error("See your dashboard immediately!", {
        duration: 10000,
        style: { backgroundColor: "red", color: "white" }
      });

      await sendNotification({
        userId: supplierId,
        title: "URGENT: Orders Pending",
        message: "See your dashboard immediately. Orders are waiting.",
        type: "alert"
      });

      // Stage 3: After 5 more minutes, flag for admin
      setTimeout(async () => {
        const { data: updatedOrder } = await supabase
          .from("orders")
          .select("status")
          .eq("id", orderId)
          .single();

        if (updatedOrder?.status === "pending") {
          // Notify admin
          await supabase.from("order_escalations").insert({
            order_id: orderId,
            supplier_id: supplierId,
            admin_notified: true,
            status: "escalated"
          });

          toast.error("Admin has been notified. They will contact you shortly.");
        }
      }, 5 * 60 * 1000);
    }
  }

  if (loading) {
    return <div className="loading-spinner">Loading dashboard...</div>;
  }

  return (
    <SupplierLayout>
      <div className="supplier-dashboard">
        <div className="dashboard-header">
          <h1>Supplier Dashboard</h1>
          <p>Manage your orders and inventory</p>
        </div>

        <StatsCards stats={stats} />

        <div className="orders-section">
          <div className="section-header">
            <h2>Recent Orders</h2>
            <button onClick={() => router.push("/supplier/orders")}>
              View All Orders →
            </button>
          </div>

          <div className="orders-grid">
            {orders.slice(0, 5).map((order) => (
              <OrderCard 
                key={order.id} 
                order={order}
                onView={() => router.push(`/supplier/orders/${order.id}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </SupplierLayout>
  );
}