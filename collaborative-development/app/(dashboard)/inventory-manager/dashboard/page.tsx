"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { WelcomeMessage } from "@/components/shared/WelcomeMessage";
import { createClient } from "@/lib/supabase/client";
import { 
  Package, 
  AlertTriangle, 
  AlertCircle, 
  DollarSign, 
  TrendingUp, 
  ShoppingCart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  XCircle,
  BarChart3,
  Layers,
  Truck,
  Users,
  MoreVertical
} from "lucide-react";
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
import styles from "@/components/layout/PortalLayout.module.css";

export default function IMDashboardPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ 
    totalProducts: 0, 
    lowStock: 0, 
    outOfStock: 0, 
    totalValue: 0,
    totalOrders: 0,
    pendingOrders: 0,
    deliveredOrders: 0
  });
  const [lowStockItems, setLowStockItems] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  // Get organization ID first
  useEffect(() => {
    const getOrgId = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userRow } = await supabase
          .from("users")
          .select("org_id")
          .eq("auth_user_id", user.id)
          .single();

        if (userRow?.org_id) {
          setOrgId(userRow.org_id);
        }
      } catch (err) {
        console.error("Error fetching org ID:", err);
      }
    };

<<<<<<< Updated upstream
        // Fetch all products for THIS organization to reflect true inventory count
        const { data: prodData } = await supabase
=======
    getOrgId();
  }, [supabase]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!orgId) return;

      try {
        setLoading(true);
        
        // Fetch products
        const { data: prodData, error: prodError } = await supabase
>>>>>>> Stashed changes
          .from("products")
          .select(`
            id,
            name,
            sku,
            selling_price,
            current_stock,
            min_stock_level,
            supplier_id,
            suppliers:supplier_id (name),
<<<<<<< Updated upstream
            categories:category_id (name)
          `)
          .eq("org_id", userRow.org_id);
=======
            category_id,
            categories:category_id (name),
            created_at
          `)
          .eq("org_id", orgId);
>>>>>>> Stashed changes

        if (prodError) throw prodError;

        // Fetch purchase orders
        const { data: orderData, error: orderError } = await supabase
          .from("purchase_orders")
          .select(`
            id,
            order_number,
            status,
            priority,
            total_amount,
            created_at,
            supplier_id,
            suppliers:supplier_id (name)
          `)
          .eq("org_id", orgId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (orderError) throw orderError;

        // Process products data
        const inventory = (prodData || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku || "",
          price: Number(p.selling_price || 0),
          stock: Number(p.current_stock || 0),
          min_stock_level: Number(p.min_stock_level || 10),
          supplier_name: p.suppliers?.name || "Unknown",
          category_name: p.categories?.name || "Uncategorized",
          created_at: p.created_at
        }));

        // Calculate statistics
        const totalProducts = inventory.length;
        const lowStock = inventory.filter(p => p.stock > 0 && p.stock <= p.min_stock_level).length;
        const outOfStock = inventory.filter(p => p.stock === 0).length;
        const totalValue = inventory.reduce((acc, p) => acc + (p.price * p.stock), 0);

        // Process orders
        const totalOrders = (orderData || []).length;
        const pendingOrders = (orderData || []).filter(o => o.status === 'pending').length;
        const deliveredOrders = (orderData || []).filter(o => o.status === 'delivered').length;

        // Get top products by stock value
        const topProductsByValue = [...inventory]
          .sort((a, b) => (b.price * b.stock) - (a.price * a.stock))
          .slice(0, 5);

        // Get category distribution
        const categoryMap = new Map();
        inventory.forEach(p => {
          const cat = p.category_name;
          categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
        });
        const categoryChartData = Array.from(categoryMap.entries()).map(([name, value]) => ({
          name,
          value,
          color: getRandomColor()
        }));

        setStats({ 
          totalProducts, 
          lowStock, 
          outOfStock, 
          totalValue,
          totalOrders,
          pendingOrders,
          deliveredOrders
        });
        setLowStockItems(inventory.filter(p => p.stock <= p.min_stock_level).sort((a, b) => a.stock - b.stock));
        setProducts(inventory);
        setRecentOrders(orderData || []);
        setTopProducts(topProductsByValue);
        setCategoryData(categoryChartData);
        
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [supabase, orgId]);

  const getRandomColor = () => {
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const getStatusColor = (status: string) => {
    switch(status?.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'delivered': return '#059669';
      case 'rejected': return '#dc2626';
      default: return '#6b7280';
    }
  };

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-screen">
          <div className="loading-spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <WelcomeMessage roleOverride="Inventory Manager" />
      <div className="dashboard-container">
        {/* Hero Section */}
        <div className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Inventory Overview</h1>
            <p className="hero-subtitle">Track your stock, orders, and performance metrics</p>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="hero-stat-label">Last Updated</span>
              <span className="hero-stat-value">{new Date().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid-enhanced">
          <div className="stat-card-enhanced">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <Package size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Total Products</p>
              <h3 className="stat-value">{stats.totalProducts}</h3>
              <span className="stat-trend positive">
                <TrendingUp size={12} />
                +12% this month
              </span>
            </div>
          </div>

          <div className="stat-card-enhanced">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
              <AlertTriangle size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Low Stock Alert</p>
              <h3 className="stat-value" style={{ color: '#f5576c' }}>{stats.lowStock}</h3>
              <span className="stat-trend warning">
                <AlertCircle size={12} />
                Needs attention
              </span>
            </div>
          </div>

          <div className="stat-card-enhanced">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
              <ShoppingCart size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Pending Orders</p>
              <h3 className="stat-value">{stats.pendingOrders}</h3>
              <span className="stat-trend">
                <Clock size={12} />
                Awaiting approval
              </span>
            </div>
          </div>

          <div className="stat-card-enhanced">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
              <DollarSign size={24} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Inventory Value</p>
              <h3 className="stat-value">₹{stats.totalValue.toLocaleString()}</h3>
              <span className="stat-trend positive">
                <ArrowUpRight size={12} />
                +8.2% from last month
              </span>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="charts-grid">
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">
                <BarChart3 size={18} />
                Category Distribution
              </h3>
              <p className="chart-subtitle">Products by category</p>
            </div>
            <div className="chart-content">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">
                <TrendingUp size={18} />
                Top Products by Value
              </h3>
              <p className="chart-subtitle">Highest inventory value products</p>
            </div>
            <div className="chart-content">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topProducts} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" />
                  <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} />
                  <Bar dataKey="price" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                    {topProducts.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Tables Section */}
        <div className="tables-grid">
          {/* Stock Alerts Table */}
          <div className="table-card">
            <div className="table-header">
              <div className="table-title-section">
                <AlertTriangle size={18} color="#f59e0b" />
                <h3 className="table-title">Critical Stock Alerts</h3>
              </div>
              <span className="badge">{lowStockItems.length} items</span>
            </div>
            {lowStockItems.length > 0 ? (
              <div className="table-responsive">
                <table className="enhanced-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th>Current Stock</th>
                      <th>Min Level</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lowStockItems.slice(0, 5).map(item => (
                      <tr key={item.id}>
                        <td className="product-cell">
                          <div className="product-info">
                            <span className="product-name">{item.name}</span>
                            <span className="product-sku">{item.sku}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`stock-badge ${item.stock === 0 ? 'out' : 'low'}`}>
                            {item.stock} units
                          </span>
                        </td>
                        <td>{item.min_stock_level} units</td>
                        <td>
                          <span className="status-badge warning">
                            {item.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                          </span>
                        </td>
                        <td>
                          <button className="action-button">Reorder</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-enhanced">
                <CheckCircle size={48} />
                <p>All products have sufficient stock!</p>
              </div>
            )}
          </div>

          {/* Recent Orders Table */}
          <div className="table-card">
            <div className="table-header">
              <div className="table-title-section">
                <Truck size={18} color="#3b82f6" />
                <h3 className="table-title">Recent Purchase Orders</h3>
              </div>
              <button className="view-all-btn">View All →</button>
            </div>
            {recentOrders.length > 0 ? (
              <div className="table-responsive">
                <table className="enhanced-table">
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Supplier</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map(order => (
                      <tr key={order.id}>
                        <td className="order-number">{order.order_number}</td>
                        <td>{order.suppliers?.name || 'Unknown'}</td>
                        <td className="amount">₹{order.total_amount?.toLocaleString()}</td>
                        <td>
                          <span 
                            className="status-badge"
                            style={{ 
                              background: `${getStatusColor(order.status)}15`,
                              color: getStatusColor(order.status)
                            }}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state-enhanced">
                <Package size={48} />
                <p>No orders found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          min-height: 100vh;
        }

        /* Hero Section */
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
          letter-spacing: -0.5px;
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

        /* Stats Grid Enhanced */
        .stats-grid-enhanced {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }

        .stat-card-enhanced {
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

        .stat-card-enhanced:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.1);
        }

        .stat-icon-wrapper {
          width: 60px;
          height: 60px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

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
          font-size: 32px;
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

        /* Charts Grid */
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

        /* Tables Grid */
        .tables-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .table-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
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

        .badge {
          background: #f1f5f9;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
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

        .enhanced-table {
          width: 100%;
          border-collapse: collapse;
        }

        .enhanced-table th {
          text-align: left;
          padding: 16px 20px;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          background: #f8fafc;
        }

        .enhanced-table td {
          padding: 16px 20px;
          font-size: 14px;
          color: #1e293b;
          border-bottom: 1px solid #f1f5f9;
        }

        .enhanced-table tbody tr:hover {
          background: #f8fafc;
        }

        .product-cell {
          min-width: 200px;
        }

        .product-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .product-name {
          font-weight: 600;
          color: #1e293b;
        }

        .product-sku {
          font-size: 11px;
          color: #94a3b8;
        }

        .stock-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .stock-badge.low {
          background: #fef3c7;
          color: #d97706;
        }

        .stock-badge.out {
          background: #fee2e2;
          color: #dc2626;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: capitalize;
        }

        .status-badge.warning {
          background: #fef3c7;
          color: #d97706;
        }

        .order-number {
          font-weight: 600;
          color: #3b82f6;
        }

        .amount {
          font-weight: 600;
          color: #1e293b;
        }

        .action-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(102,126,234,0.3);
        }

        .empty-state-enhanced {
          text-align: center;
          padding: 60px;
          color: #94a3b8;
        }

        .empty-state-enhanced p {
          margin-top: 16px;
          font-size: 14px;
        }

        /* Loading Screen */
        .loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          gap: 20px;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #f1f5f9;
          border-top-color: #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .charts-grid {
            grid-template-columns: 1fr;
          }
          
          .tables-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .dashboard-container {
            padding: 16px;
          }
          
          .hero-section {
            flex-direction: column;
            text-align: center;
            gap: 20px;
            padding: 24px;
          }
          
          .stats-grid-enhanced {
            grid-template-columns: 1fr;
          }
          
          .hero-title {
            font-size: 24px;
          }
        }
      `}</style>
    </>
  );
}