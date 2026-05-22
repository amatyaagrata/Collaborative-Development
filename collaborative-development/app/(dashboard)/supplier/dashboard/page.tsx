"use client";

import React, { useState, useEffect, useCallback } from "react";
import { WelcomeMessage } from "@/components/shared/WelcomeMessage";
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  CreditCard, 
  DollarSign, 
  CheckCircle, 
  Loader2, 
  Inbox,
  TrendingUp,
  Clock,
  AlertCircle,
  ArrowUpRight,
  Calendar,
  Eye,
  Filter,
  Users,
  Star,
  Box
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';

interface DashboardStats {
  totalProducts: number;
  pendingOrders: number;
  completedOrders: number;
  totalEarnings: number;
  totalOrders: number;
  monthlyGrowth: number;
  activeProducts: number;
  totalCustomers: number;
  averageRating: number;
  lowStockCount: number;
  totalStock: number;
}

interface RecentOrder {
  id: string;
  order_number: string;
  org: string;
  date: string;
  amount: number;
  status: string;
  priority: string;
}

interface PaymentItem {
  status: string;
  amount: number;
  count: number;
  color: string;
}

interface MonthlyData {
  name: string;
  earnings: number;
  orders: number;
}

export default function SupplierDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({ 
    totalProducts: 0, 
    pendingOrders: 0, 
    completedOrders: 0, 
    totalEarnings: 0,
    totalOrders: 0,
    monthlyGrowth: 12,
    activeProducts: 0,
    totalCustomers: 0,
    averageRating: 0,
    lowStockCount: 0,
    totalStock: 0
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [supplierId, setSupplierId] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to continue");
        return;
      }

      // Get supplier info from email
      const { data: supplier, error: supplierError } = await supabase
        .from("suppliers")
        .select("id, org_id, name")
        .eq("email", user.email)
        .single();

      if (supplierError || !supplier) {
        console.error("Supplier not found:", supplierError);
        setLoading(false);
        return;
      }

      setSupplierId(supplier.id);

      // 1. Fetch products from supplier_products table
      const { data: productsData, error: productsError } = await supabase
        .from("supplier_products")
        .select("*")
        .eq("supplier_id", supplier.id);

      if (productsError) {
        console.error("Products fetch error:", productsError);
      }

      const products = productsData || [];
      const totalProducts = products.length;
      const activeProducts = products.filter(p => p.is_available !== false).length;
      const totalStock = products.reduce((sum, p) => sum + (p.stock_quantity || 0), 0);
      const lowStockCount = products.filter(p => (p.stock_quantity || 0) < (p.min_stock_level || 10)).length;
      const totalValue = products.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.price || 0)), 0);

      // 2. Fetch orders from purchase_orders table
      const { data: orders, error: ordersError } = await supabase
        .from("purchase_orders")
        .select(`
          id,
          order_number,
          status,
          priority,
          total_amount,
          created_at,
          supplier_id,
          organizations:org_id (name)
        `)
        .eq("supplier_id", supplier.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("Orders fetch error:", ordersError);
      }

      const allOrders = orders || [];
      
      // Calculate order stats
      const pendingOrders = allOrders.filter(o => o.status === "pending").length;
      const completedOrders = allOrders.filter(o => o.status === "delivered").length;
      const totalOrders = allOrders.length;
      const totalEarnings = allOrders
        .filter(o => o.status === "delivered")
        .reduce((sum, o) => sum + (o.total_amount || 0), 0);

      // Get unique customers
      const uniqueOrgs = new Set(allOrders.map(o => (o.organizations as any)?.name).filter(Boolean));
      
      // Calculate average rating (mock for now - replace with actual reviews from order_items or feedback table)
      const averageRating = 4.5;

      setStats({
        totalProducts,
        pendingOrders,
        completedOrders,
        totalEarnings,
        totalOrders,
        monthlyGrowth: 12,
        activeProducts,
        totalCustomers: uniqueOrgs.size,
        averageRating,
        lowStockCount,
        totalStock
      });

      // 3. Map Recent Orders
      setRecentOrders(allOrders.slice(0, 5).map(o => ({
        id: o.id,
        order_number: o.order_number ?? o.id.slice(0, 8),
        org: (o.organizations as any)?.name || "N/A",
        date: new Date(o.created_at).toLocaleDateString(),
        amount: o.total_amount || 0,
        status: o.status,
        priority: o.priority || "medium"
      })));

      // 4. Payment Summary
      const summaryMap: Record<string, { amount: number; count: number }> = {
        "pending": { amount: 0, count: 0 },
        "in_progress": { amount: 0, count: 0 },
        "completed": { amount: 0, count: 0 },
      };

      allOrders.forEach(o => {
        if (o.status === "delivered") {
          summaryMap.completed.count += 1;
          summaryMap.completed.amount += (o.total_amount || 0);
        } else if (["approved", "driver_assigned", "in_transit", "shipped"].includes(o.status)) {
          summaryMap.in_progress.count += 1;
          summaryMap.in_progress.amount += (o.total_amount || 0);
        } else {
          summaryMap.pending.count += 1;
          summaryMap.pending.amount += (o.total_amount || 0);
        }
      });

      setPayments([
        { status: "Pending", amount: summaryMap.pending.amount, count: summaryMap.pending.count, color: "#f59e0b" },
        { status: "In Progress", amount: summaryMap.in_progress.amount, count: summaryMap.in_progress.count, color: "#3b82f6" },
        { status: "Completed", amount: summaryMap.completed.amount, count: summaryMap.completed.count, color: "#10b981" },
      ]);

      // 5. Generate monthly data for chart
      const monthlyEarnings: Record<string, number> = {};
      const monthlyOrders: Record<string, number> = {};
      
      allOrders.forEach(o => {
        const month = new Date(o.created_at).toLocaleString('default', { month: 'short' });
        if (o.status === "delivered") {
          monthlyEarnings[month] = (monthlyEarnings[month] || 0) + (o.total_amount || 0);
        }
        monthlyOrders[month] = (monthlyOrders[month] || 0) + 1;
      });
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const chartData = months.map(month => ({
        name: month,
        earnings: monthlyEarnings[month] || 0,
        orders: monthlyOrders[month] || 0
      }));
      setMonthlyData(chartData);

    } catch (err) {
      console.error("Dashboard fetch error:", err);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'delivered': return '#059669';
      case 'rejected': return '#dc2626';
      case 'shipped': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch(priority?.toLowerCase()) {
      case 'high': return '#dc2626';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981'];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading dashboard data...</p>
        <style jsx>{`
          .dashboard-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 400px;
            gap: 16px;
          }
          .loading-spinner {
            width: 50px;
            height: 50px;
            border: 3px solid #f1f5f9;
            border-top-color: #7c3aed;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <WelcomeMessage roleOverride="Supplier" />
      <div className="supplier-dashboard">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Supplier Dashboard</h1>
            <p className="hero-subtitle">Track your products, orders, and earnings</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-label">Last Updated</span>
              <span className="hero-stat-value">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon purple"><Package size={24} /></div>
            <div className="stat-content">
              <p className="stat-label">Total Products</p>
              <h3 className="stat-value">{stats.totalProducts}</h3>
              <span className="stat-trend">{stats.activeProducts} active</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orange"><ShoppingCart size={24} /></div>
            <div className="stat-content">
              <p className="stat-label">Pending Orders</p>
              <h3 className="stat-value" style={{ color: '#f59e0b' }}>{stats.pendingOrders}</h3>
              <span className="stat-trend warning">Awaiting approval</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon green"><CheckCircle size={24} /></div>
            <div className="stat-content">
              <p className="stat-label">Completed Orders</p>
              <h3 className="stat-value">{stats.completedOrders}</h3>
              <span className="stat-trend positive">
                <ArrowUpRight size={12} />
                {stats.totalOrders > 0 ? Math.round((stats.completedOrders / stats.totalOrders) * 100) : 0}% completion
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue"><DollarSign size={24} /></div>
            <div className="stat-content">
              <p className="stat-label">Total Earnings</p>
              <h3 className="stat-value">₹{stats.totalEarnings.toLocaleString()}</h3>
              <span className="stat-trend positive">
                <TrendingUp size={12} />
                +{stats.monthlyGrowth}% this month
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon teal"><Users size={24} /></div>
            <div className="stat-content">
              <p className="stat-label">Total Customers</p>
              <h3 className="stat-value">{stats.totalCustomers}</h3>
              <span className="stat-trend">unique organizations</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon yellow"><Star size={24} /></div>
            <div className="stat-content">
              <p className="stat-label">Rating</p>
              <h3 className="stat-value">{stats.averageRating} ★</h3>
              <span className="stat-trend">excellent feedback</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon indigo"><Box size={24} /></div>
            <div className="stat-content">
              <p className="stat-label">Total Stock</p>
              <h3 className="stat-value">{stats.totalStock.toLocaleString()}</h3>
              <span className="stat-trend">units available</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red"><AlertCircle size={24} /></div>
            <div className="stat-content">
              <p className="stat-label">Low Stock Items</p>
              <h3 className="stat-value" style={{ color: stats.lowStockCount > 0 ? '#dc2626' : '#10b981' }}>
                {stats.lowStockCount}
              </h3>
              <span className="stat-trend warning">needs attention</span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">
                <TrendingUp size={18} />
                Monthly Earnings
              </h3>
              <p className="chart-subtitle">Revenue trend over the last 12 months</p>
            </div>
            <div className="chart-content">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Area 
                    type="monotone" 
                    dataKey="earnings" 
                    stroke="#7c3aed" 
                    fill="url(#colorGradient)" 
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">
                <CreditCard size={18} />
                Payment Distribution
              </h3>
              <p className="chart-subtitle">Orders by payment status</p>
            </div>
            <div className="chart-content">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={payments}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="amount"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {payments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="table-card">
          <div className="table-header">
            <div className="table-title-section">
              <Truck size={18} color="#3b82f6" />
              <h3 className="table-title">Recent Orders</h3>
            </div>
            <button className="view-all-btn" onClick={() => window.location.href = '/supplier/orders'}>
              View All Orders →
            </button>
          </div>
          <div className="table-responsive">
            {recentOrders.length === 0 ? (
              <div className="empty-state">
                <Inbox size={48} />
                <p>No orders found</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Organization</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Priority</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map(order => (
                    <tr key={order.id} className="clickable-row" onClick={() => window.location.href = `/supplier/orders/${order.id}`}>
                      <td className="order-number">#{order.order_number}</td>
                      <td>{order.org}</td>
                      <td>{order.date}</td>
                      <td className="amount">₹{order.amount.toLocaleString()}</td>
                      <td>
                        <span className={`priority-badge ${order.priority}`}>
                          {order.priority}
                        </span>
                      </td>
                      <td>
                        <span className="status-badge" style={{ 
                          background: `${getStatusColor(order.status)}15`,
                          color: getStatusColor(order.status)
                        }}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Payment Summary Cards */}
        <div className="payment-summary-grid">
          {payments.map((payment, index) => (
            <div key={payment.status} className="payment-card">
              <div className="payment-header" style={{ borderBottomColor: payment.color }}>
                <div className="payment-status" style={{ background: `${payment.color}15`, color: payment.color }}>
                  {payment.status}
                </div>
                <span className="payment-count">{payment.count} orders</span>
              </div>
              <div className="payment-body">
                <p className="payment-label">Total Amount</p>
                <p className="payment-amount">₹{payment.amount.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .supplier-dashboard {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
        }

        .hero-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 24px;
          padding: 32px 40px;
          margin-bottom: 32px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }

        .hero-title {
          font-size: 32px;
          font-weight: 800;
          color: white;
          margin: 0 0 8px 0;
        }

        .hero-subtitle {
          font-size: 16px;
          color: rgba(255,255,255,0.9);
          margin: 0;
        }

        .hero-stats {
          background: rgba(255,255,255,0.2);
          backdrop-filter: blur(10px);
          padding: 12px 24px;
          border-radius: 16px;
        }

        .hero-stat {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .hero-stat-label {
          font-size: 12px;
          color: rgba(255,255,255,0.8);
        }

        .hero-stat-value {
          font-size: 18px;
          font-weight: 700;
          color: white;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: all 0.3s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          cursor: pointer;
        }

        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }

        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .stat-icon.purple { background: #f3e8ff; color: #7c3aed; }
        .stat-icon.orange { background: #fef3c7; color: #f59e0b; }
        .stat-icon.green { background: #dcfce7; color: #10b981; }
        .stat-icon.blue { background: #dbeafe; color: #3b82f6; }
        .stat-icon.teal { background: #ccfbf1; color: #14b8a6; }
        .stat-icon.yellow { background: #fef9c3; color: #eab308; }
        .stat-icon.indigo { background: #e0e7ff; color: #4f46e5; }
        .stat-icon.red { background: #fee2e2; color: #dc2626; }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          font-size: 13px;
          color: #64748b;
          margin: 0 0 4px 0;
          font-weight: 500;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 800;
          color: #1e293b;
          margin: 0 0 8px 0;
        }

        .stat-trend {
          font-size: 12px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          color: #10b981;
        }

        .stat-trend.warning {
          color: #f59e0b;
        }

        .stat-trend.positive {
          color: #10b981;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(500px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .chart-card {
          background: white;
          border-radius: 20px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }

        .chart-card:hover {
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }

        .chart-header {
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 2px solid #f1f5f9;
        }

        .chart-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .chart-subtitle {
          font-size: 13px;
          color: #64748b;
          margin: 0;
        }

        .chart-content {
          min-height: 300px;
        }

        .table-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          margin-bottom: 32px;
          transition: all 0.3s ease;
        }

        .table-card:hover {
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }

        .table-header {
          padding: 20px 24px;
          border-bottom: 2px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .table-title-section {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .table-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .view-all-btn {
          background: none;
          border: none;
          color: #3b82f6;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-all-btn:hover {
          color: #2563eb;
          transform: translateX(4px);
        }

        .table-responsive {
          overflow-x: auto;
        }

        .data-table {
          width: 100%;
          border-collapse: collapse;
        }

        .data-table th {
          text-align: left;
          padding: 16px 20px;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #f8fafc;
        }

        .data-table td {
          padding: 16px 20px;
          font-size: 14px;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
        }

        .data-table tbody tr:hover {
          background: #f8fafc;
        }

        .clickable-row {
          cursor: pointer;
        }

        .order-number {
          font-weight: 600;
          color: #3b82f6;
        }

        .amount {
          font-weight: 600;
          color: #1e293b;
        }

        .priority-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .priority-badge.high {
          background: #fee2e2;
          color: #dc2626;
        }

        .priority-badge.medium {
          background: #fef3c7;
          color: #f59e0b;
        }

        .priority-badge.low {
          background: #dcfce7;
          color: #10b981;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .payment-summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .payment-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          transition: all 0.3s ease;
        }

        .payment-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }

        .payment-header {
          padding: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 3px solid;
        }

        .payment-status {
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }

        .payment-count {
          font-size: 13px;
          color: #64748b;
        }

        .payment-body {
          padding: 20px;
        }

        .payment-label {
          font-size: 12px;
          color: #64748b;
          margin: 0 0 8px 0;
        }

        .payment-amount {
          font-size: 28px;
          font-weight: 800;
          color: #1e293b;
          margin: 0;
        }

        .empty-state {
          text-align: center;
          padding: 60px;
          color: #94a3b8;
        }

        .empty-state p {
          margin-top: 16px;
        }

        @media (max-width: 1200px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .supplier-dashboard {
            padding: 16px;
          }
          .hero-section {
            flex-direction: column;
            text-align: center;
            gap: 20px;
            padding: 24px;
          }
          .stats-grid {
            grid-template-columns: 1fr;
          }
          .hero-title {
            font-size: 24px;
          }
          .payment-summary-grid {
            grid-template-columns: 1fr;
          }
          .data-table th, .data-table td {
            padding: 12px;
          }
        }
      `}</style>
    </>
  );
}