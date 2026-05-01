/**
 * Role configuration for GoGodam role-based access control.
 * Single source of truth for roles, nav items, and redirect paths.
 */

export type UserRole = 'admin' | 'inventory_manager' | 'supplier' | 'transporter';

/** Map DB role strings (old and new schema) to canonical UserRole */
export function normalizeRole(role?: string | null): UserRole {
  if (!role) return 'inventory_manager';
  const r = role.toLowerCase().replace(/\s+/g, '_');
  if (r === 'admin') return 'admin';
  if (r === 'supplier') return 'supplier';
  if (r === 'transporter' || r === 'driver') return 'transporter';
  if (r === 'inventory_manager' || r === 'inventory manager') return 'inventory_manager';
  return 'inventory_manager';
}

/** Get the dashboard redirect URL for a given role */
export function getRoleRedirect(role: UserRole): string {
  switch (role) {
    case 'admin':            return '/admin/dashboard';
    case 'inventory_manager': return '/inventory-manager/dashboard';
    case 'supplier':         return '/supplier/dashboard';
    case 'transporter':      return '/transporter/dashboard';
    default:                 return '/inventory-manager/dashboard';
  }
}

/** Display labels for each role */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin:             'Admin',
  inventory_manager: 'Inventory Manager',
  supplier:          'Supplier',
  transporter:       'Transporter',
};

export interface NavItem {
  label: string;
  href:  string;
  icon:  string;
}

/** Sidebar navigation items per role */
export const ROLE_NAV_ITEMS: Record<UserRole, NavItem[]> = {
  admin: [
    { label: 'Dashboard',    href: '/admin/dashboard',     icon: 'LayoutDashboard' },
    { label: 'Requests',     href: '/admin/requests',      icon: 'ClipboardList'   },
    { label: 'Users',        href: '/admin/users',         icon: 'Users'           },
    { label: 'Organizations',href: '/admin/organizations', icon: 'Building2'       },
    { label: 'Settings',     href: '/admin/settings',      icon: 'Settings'        },
  ],
  inventory_manager: [
    { label: 'Dashboard', href: '/inventory-manager/dashboard', icon: 'LayoutDashboard' },
    { label: 'Products',  href: '/inventory-manager/products',  icon: 'Package'         },
    { label: 'Stock',     href: '/inventory-manager/stock',     icon: 'ShoppingCart'    },
    { label: 'Reports',   href: '/inventory-manager/reports',   icon: 'FileText'        },
  ],
  supplier: [
    { label: 'Dashboard', href: '/supplier/dashboard', icon: 'LayoutDashboard' },
    { label: 'Products',  href: '/supplier/products',  icon: 'Package'         },
    { label: 'Orders',    href: '/supplier/orders',    icon: 'ShoppingCart'    },
    { label: 'Payments',  href: '/supplier/payments',  icon: 'CreditCard'      },
  ],
  transporter: [
    { label: 'Dashboard',   href: '/transporter/dashboard',   icon: 'LayoutDashboard' },
    { label: 'Deliveries',  href: '/transporter/deliveries',  icon: 'Truck'           },
    { label: 'Routes',      href: '/transporter/routes',      icon: 'MapPin'          },
    { label: 'Vehicles',    href: '/transporter/vehicles',    icon: 'Car'             },
  ],
};

/** Route prefix owned by each role */
export const ROLE_ROUTE_PREFIX: Record<UserRole, string> = {
  admin:             '/admin',
  inventory_manager: '/inventory-manager',
  supplier:          '/supplier',
  transporter:       '/transporter',
};

/** Public routes that do not require authentication */
export const PUBLIC_ROUTES = ['/login', '/signup'];
