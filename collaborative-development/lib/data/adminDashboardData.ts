// ═══════════════════════════════════════════════════════════════
// Admin Dashboard Mock Data — GoGodam Inventory Management System
// Replace with Supabase API calls when backend is ready
// ═══════════════════════════════════════════════════════════════

// ─── Dashboard Stats ────────────────────────────────────────────
export const adminStats = {
  inventoryRevenue: "Rs. 2,54,890",
  activeUsers: 22,
  inactiveUsers: 9,
  applicationCount: 13,
};

// ─── Product Summary ────────────────────────────────────────────
export const adminProductSummary = {
  quantityInHand: 1500,
  toBeReceived: 500,
};

// ─── Trending Products ──────────────────────────────────────────
export interface AdminTrendingProduct {
  id: number;
  product: string;
  suppliers: string;
  productId: string;
  category: string;
  price: string;
  quantity: number;
}

export const adminTrendingProducts: AdminTrendingProduct[] = [
  { id: 1, product: "Product", suppliers: "AB", productId: "#502k", category: "Red", price: "$900", quantity: 97 },
  { id: 2, product: "Product", suppliers: "AB", productId: "#502k", category: "Red", price: "$900", quantity: 97 },
  { id: 3, product: "Product", suppliers: "AB", productId: "#502k", category: "Red", price: "$900", quantity: 97 },
  { id: 4, product: "Product", suppliers: "AB", productId: "#502k", category: "Red", price: "$900", quantity: 97 },
];

// ─── Sales & Purchase Data (Weekly) ─────────────────────────────
export interface AdminSalesDataPoint {
  name: string;
  Sales: number;
  Purchase: number;
}

export const adminSalesData: AdminSalesDataPoint[] = [
  { name: "Mon", Sales: 10200, Purchase: 8400 },
  { name: "Tue", Sales: 8800, Purchase: 7200 },
  { name: "Wed", Sales: 12400, Purchase: 9600 },
  { name: "Thu", Sales: 9600, Purchase: 10800 },
  { name: "Fri", Sales: 11200, Purchase: 8000 },
  { name: "Sat", Sales: 7400, Purchase: 6200 },
  { name: "Sun", Sales: 6800, Purchase: 5400 },
];

// ─── Admin Users & Applications ───────────────────────────────────
export interface AdminActiveUser {
  id: number;
  name: string;
  email: string;
  role: string;
  organization: string;
  subscription: string;
}

export const adminActiveUsers: AdminActiveUser[] = [
  { id: 1, name: "Test Supplier", email: "supplier@gogodam.com", role: "Supplier", organization: "Supplier Org A", subscription: "None" },
  { id: 2, name: "Test Driver", email: "driver@gogodam.com", role: "Driver", organization: "—", subscription: "None" },
  { id: 3, name: "Normal User", email: "user@example.com", role: "User", organization: "—", subscription: "None" },
];

export interface AdminApplication {
  id: number;
  organization: string;
  email: string;
  phone: string;
  requirement: string;
  status: string;
}

export const adminApplications: AdminApplication[] = [
  { id: 101, organization: "New Logistics LLC", email: "hello@newlogistics.com", phone: "+977-9800000000", requirement: "We need supplier access to update our inventory.", status: "Pending" },
  { id: 102, organization: "Kathmandu Transport", email: "contact@ktmtransport.com", phone: "+977-9811111111", requirement: "Driver registration for our new fleet.", status: "Pending" }
];

// ─── Admin Sidebar Navigation ───────────────────────────────────
export interface AdminNavItem {
  label: string;
  href: string;
  icon: string;
}

export const adminSidebarNavItems: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: "LayoutDashboard" },
  { label: "Users", href: "/admin/users", icon: "Users" },
  { label: "Reports", href: "/admin/reports", icon: "FileText" },
  { label: "Tracking", href: "/admin/tracking", icon: "MapPin" },
  { label: "Settings", href: "/admin/settings", icon: "Settings" },
];
