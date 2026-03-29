// Mock data for Dashboard — replace with API calls when backend is ready

export const dashboardStats = {
  inventoryValue: "2,54,890",
  totalStocks: 2684,
  newOrders: 769,
  delivered: 367,
};

export const productSummary = {
  quantityInHand: 1500,
  toBeReceived: 500,
};

export interface TrendingProduct {
  id: number;
  product: string;
  suppliers: string;
  productId: string;
  category: string;
  price: string;
  quantity: number;
}

export const trendingProducts: TrendingProduct[] = [
  { id: 1, product: "Product", suppliers: "AB", productId: "#502k", category: "Red", price: "$900", quantity: 97 },
  { id: 2, product: "Product", suppliers: "AB", productId: "#502k", category: "Red", price: "$900", quantity: 97 },
  { id: 3, product: "Product", suppliers: "AB", productId: "#502k", category: "Red", price: "$900", quantity: 97 },
  { id: 4, product: "Product", suppliers: "AB", productId: "#502k", category: "Red", price: "$900", quantity: 97 },
];

export interface SalesDataPoint {
  name: string;
  Sales: number;
  Purchase: number;
}

export const salesData: SalesDataPoint[] = [
  { name: "Mon", Sales: 10200, Purchase: 8400 },
  { name: "Tue", Sales: 8800, Purchase: 7200 },
  { name: "Wed", Sales: 12400, Purchase: 9600 },
  { name: "Thu", Sales: 9600, Purchase: 10800 },
  { name: "Fri", Sales: 11200, Purchase: 8000 },
  { name: "Sat", Sales: 7400, Purchase: 6200 },
  { name: "Sun", Sales: 6800, Purchase: 5400 },
];

export interface NavItem {
  label: string;
  href: string;
  icon: string;
}

export const sidebarNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
  { label: "Product", href: "#", icon: "Package" },
  { label: "Categories", href: "#", icon: "Grid3x3" },
  { label: "Orders", href: "#", icon: "ShoppingCart" },
  { label: "Transfer", href: "#", icon: "Truck" },
  { label: "Reports", href: "#", icon: "FileText" },
  { label: "Users", href: "#", icon: "Users" },
  { label: "Settings", href: "#", icon: "Settings" },
];
