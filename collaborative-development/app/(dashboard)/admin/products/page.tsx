'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, Package, TrendingUp, ShoppingCart, AlertCircle, Plus } from 'lucide-react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  selling_price: number
  current_stock: number
  categories?: { name: string }
  created_at: string
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    setLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError);
        setLoading(false);
        return;
      }

      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('org_id')
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        console.error('User fetch error:', userError);
        setLoading(false);
        return;
      }

      if (userRow?.org_id) {
        const { data, error: productsError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            selling_price,
            current_stock,
            created_at,
            categories (
              name
            )
          `)
          .eq('org_id', userRow.org_id)
          .order('created_at', { ascending: false });

        if (productsError) {
          console.error('Products fetch error:', productsError);
        } else {
          const mapped = (data || []).map((p: any) => ({
            ...p,
            categories: Array.isArray(p.categories) ? p.categories[0] : p.categories
          })) as Product[];
          setProducts(mapped);
        }
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    }

    setLoading(false);
  }

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalProducts = products.length
  const totalStockUnits = products.reduce((sum, p) => sum + (p.current_stock || 0), 0)
  const lowStockItems = products.filter(p => (p.current_stock || 0) < 10).length
  const totalValue = products.reduce((sum, p) => sum + ((p.current_stock || 0) * (p.selling_price || 0)), 0)

  // Generate product code
  const getProductCode = (category: string, index: number) => {
    const categoryCode = category === 'Electronics' ? 'ELC' :
                         category === 'Clothing' ? 'CLT' :
                         category === 'Home Appliances' ? 'APP' :
                         category === 'Toys' ? 'TOY' :
                         category === 'Books' ? 'BOK' :
                         'PRD';
    return `${categoryCode}-${(index + 1).toString().padStart(3, '0')}`;
  };

  return (
    <div className="admin-products">
      <style jsx>{`
        .admin-products {
          max-width: 1400px;
          margin: 0 auto;
          padding: 24px;
          background: #f8fafc;
          min-height: 100vh;
        }

        /* Header */
        .page-header {
          margin-bottom: 24px;
        }

        .page-title {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .page-subtitle {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }

        /* Stats Grid - 4 columns like screenshot */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 16px 20px;
          border: 1px solid #e9eef5;
        }

        .stat-label {
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          margin: 0 0 4px 0;
        }

        .stat-value {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }

        .stat-unit {
          font-size: 12px;
          color: #94a3b8;
          margin-top: 4px;
        }

        /* Search Bar */
        .search-wrapper {
          position: relative;
          margin-bottom: 24px;
        }

        .search-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }

        .search-input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          font-size: 14px;
          outline: none;
          background: white;
        }

        .search-input:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }

        /* Products Grid - Like screenshot cards */
        .products-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .product-card {
          background: white;
          border-radius: 16px;
          border: 1px solid #e9eef5;
          overflow: hidden;
          transition: all 0.2s;
        }

        .product-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.08);
        }

        /* Card Content - Like screenshot */
        .card-content {
          padding: 20px;
        }

        .product-code {
          font-size: 12px;
          font-weight: 600;
          color: #7c3aed;
          background: #f3e8ff;
          display: inline-block;
          padding: 4px 10px;
          border-radius: 6px;
          margin-bottom: 12px;
          font-family: monospace;
        }

        .product-name {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }

        .product-price {
          font-size: 20px;
          font-weight: 700;
          color: #7c3aed;
          margin: 8px 0;
        }

        .stock-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .in-stock {
          background: #dcfce7;
          color: #16a34a;
        }

        .low-stock {
          background: #fef3c7;
          color: #d97706;
        }

        .out-stock {
          background: #fee2e2;
          color: #dc2626;
        }

        /* Product Details - Like screenshot list */
        .product-details {
          border-top: 1px solid #f1f5f9;
          padding-top: 16px;
          margin-top: 8px;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          font-size: 13px;
        }

        .detail-label {
          color: #64748b;
        }

        .detail-value {
          font-weight: 500;
          color: #1e293b;
        }

        /* Loading & Empty States */
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px;
          gap: 16px;
          color: #64748b;
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 3px solid #f1f5f9;
          border-top-color: #7c3aed;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        .empty-state {
          text-align: center;
          padding: 80px;
          background: white;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
        }

        .empty-state h3 {
          margin: 16px 0 8px;
          color: #1e293b;
        }

        .empty-state p {
          color: #64748b;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .admin-products {
            padding: 16px;
          }
          
          .page-title {
            font-size: 20px;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          
          .stat-value {
            font-size: 22px;
          }
          
          .products-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      {/* Header */}
      <div className="page-header">
        <h1 className="page-title">Inventory Products</h1>
        <p className="page-subtitle">Products currently in your warehouse stock</p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <p className="stat-label">Total Products</p>
          <p className="stat-value">{totalProducts}</p>
          <p className="stat-unit">{totalStockUnits} units</p>
        </div>
        
        <div className="stat-card">
          <p className="stat-label">Low Stock Items</p>
          <p className="stat-value">{lowStockItems}</p>
          <p className="stat-unit">needs attention</p>
        </div>
        
        <div className="stat-card">
          <p className="stat-label">Total Value</p>
          <p className="stat-value">₹{totalValue.toLocaleString()}</p>
          <p className="stat-unit">inventory worth</p>
        </div>

        <div className="stat-card">
          <p className="stat-label">Categories</p>
          <p className="stat-value">{new Set(products.map(p => p.categories?.name).filter(Boolean)).size}</p>
          <p className="stat-unit">product types</p>
        </div>
      </div>

      {/* Search */}
      <div className="search-wrapper">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading products...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-state">
          <Package size={64} />
          <h3>No products found</h3>
          <p>Try adjusting your search</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map((product, index) => {
            const stockStatus = product.current_stock === 0 ? 'out-stock' : 
                               product.current_stock < 10 ? 'low-stock' : 'in-stock';
            const stockText = product.current_stock === 0 ? 'Out of Stock' : 
                              product.current_stock < 10 ? 'Low Stock' : 'In Stock';
            const stockClass = product.current_stock === 0 ? 'out-stock' : 
                              product.current_stock < 10 ? 'low-stock' : 'in-stock';
            const productCode = getProductCode(product.categories?.name || 'General', index);
            
            return (
              <div key={product.id} className="product-card">
                <div className="card-content">
                  <div className="product-code">{productCode}</div>
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-price">₹{product.selling_price?.toLocaleString()}</div>
                  <div className={`stock-badge ${stockClass}`}>{stockText}</div>
                  
                  <div className="product-details">
                    <div className="detail-row">
                      <span className="detail-label">Stock:</span>
                      <span className="detail-value">{product.current_stock || 0} units</span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Added:</span>
                      <span className="detail-value">
                        {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Category:</span>
                      <span className="detail-value">{product.categories?.name || 'Uncategorized'}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  )
}