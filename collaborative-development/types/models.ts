// Shared type definitions for the GoGodam application

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
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price?: number;
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
