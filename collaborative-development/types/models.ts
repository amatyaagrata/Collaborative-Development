// Shared type definitions for the GoGodam application
// Aligned with DATABASE_SCHEMA_V2.sql

// ── Base Entity Types (match DB tables) ──────────────────────

export type UserRole = 'admin' | 'supplier' | 'transporter' | 'inventory manager';

export interface Organization {
  id: string;
  name: string;
  slug?: string;
  address?: string;
  phone?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AppUser {
  id: string;
  auth_user_id?: string;
  organization_id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  organization?: Organization;
}

export interface Category {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  organization_id: string;
  user_id?: string;
  name: string;
  contact_email: string;
  contact_phone?: string;
  address?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  sku?: string;
  category_id?: string;
  price: number;
  stock: number;
  min_stock_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: Category;
  supplier_products?: SupplierProduct[];
}

export interface SupplierProduct {
  id: string;
  supplier_id: string;
  product_id: string;
  cost_price?: number;
  lead_time_days?: number;
  is_preferred: boolean;
  created_at: string;
  updated_at: string;
  suppliers?: Supplier;
  products?: Product;
}

export type StockMovementType =
  | 'purchase_in' | 'sale_out' | 'adjustment'
  | 'return_in' | 'return_out' | 'transfer' | 'damage';

export interface StockMovement {
  id: string;
  organization_id: string;
  product_id: string;
  user_id?: string;
  order_id?: string;
  movement_type: StockMovementType;
  quantity: number;
  stock_before: number;
  stock_after: number;
  reason?: string;
  created_at: string;
}

// ── Existing Composite Types ─────────────────────────────────

export interface SupplierOrder {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  delivery_address: string;
  total_amount: number;
  supplier_id?: string;
  items_count?: number;
  organizations: {
    name: string;
    address: string;
    phone: string;
  };
  order_items: Array<{
    id?: string;
    product_name?: string;
    quantity: number;
    unit_price: number;
    total_price?: number;
    products?: {
      name?: string;
    };
  }>;
}

export interface Trip {
  id: string;
  status: string;
  pickup_address?: string;
  delivery_charge: number;
  assigned_at: string;
  completed_at?: string | null;
  order_id?: string;
  supplier_id?: string;
  orders: {
    id?: string;
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

export interface TripStats {
  totalTrips: number;
  completedTrips: number;
  totalEarnings: number;
  pendingTrips: number;
}

export interface SupplierStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
}
