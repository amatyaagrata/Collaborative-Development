'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, AlertCircle } from 'lucide-react'

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
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        console.error('Auth error:', authError);
        setLoading(false);
        return;
      }

      console.log('Logged in user:', user.email);

      // Get user's organization - NO comments in select
      const { data: userRow, error: userError } = await supabase
        .from('users')
        .select('org_id')  // Clean select - no comments
        .eq('auth_user_id', user.id)
        .single();

      if (userError) {
        console.error('User fetch error:', userError);
        setLoading(false);
        return;
      }

      console.log('User org_id:', userRow?.org_id);

      if (userRow?.org_id) {
        // Fetch products - NO comments in select!
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
          console.log('Products found:', data?.length || 0);
          setProducts(data || []);
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
  )

  const totalProducts = products.length
  const totalStockUnits = products.reduce((sum, p) => sum + (p.current_stock || 0), 0)
  const lowStockItems = products.filter(p => (p.current_stock || 0) < 10).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <p className="text-gray-500 mt-1">Manage your product inventory</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-6">
          <div className="text-3xl font-bold text-gray-900">{totalProducts}</div>
          <div className="text-gray-500 mt-1">Total Products</div>
        </div>
        <div className="bg-white rounded-lg border p-6">
          <div className="text-3xl font-bold text-gray-900">{totalStockUnits}</div>
          <div className="text-gray-500 mt-1">Total Stock Units</div>
        </div>
        <div className="bg-white rounded-lg border p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div className="text-3xl font-bold text-yellow-700">{lowStockItems}</div>
          </div>
          <div className="text-yellow-600 mt-1">Low Stock Items</div>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, ID, category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="text-center py-12">Loading products...</div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No products found</p>
          <p className="text-sm text-gray-400 mt-1">Try adding some products to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  )
}

function ProductCard({ product, index }: { product: Product, index: number }) {
  const productNumber = `PRD-${(index + 1).toString().padStart(4, '0')}`;

  return (
    <div className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-sm text-gray-500">{productNumber}</div>
          <div className="font-semibold text-gray-900 mt-1">{product.name}</div>
          <div className="text-blue-600 font-medium mt-1">
            Rs. {product.selling_price?.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
        <div>
          <div className="text-xs text-gray-500">CATEGORY:</div>
          <div className="text-sm font-medium">{product.categories?.name || 'Uncategorized'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">STOCK:</div>
          <div className="text-sm font-medium">{product.current_stock || 0} units</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">ADDED:</div>
          <div className="text-sm">
            {product.created_at ? new Date(product.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">UUID:</div>
          <div className="text-sm font-mono">{product.id.slice(0, 8)}...</div>
        </div>
      </div>
    </div>
  )
}