'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, AlertCircle } from 'lucide-react'
import AdminLayout from '@/app/(dashboard)/admin/layout'

interface Product {
  id: string
  name: string
  price: number
  stock: number
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
    const { data } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('created_at', { ascending: false })
    
    if (data) setProducts(data)
    setLoading(false)
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categories?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const totalProducts = products.length
  const totalStockUnits = products.reduce((sum, p) => sum + (p.stock || 0), 0)
  const lowStockItems = products.filter(p => (p.stock || 0) < 10).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
        <p className="text-gray-500 mt-1">Manage your product inventory</p>
      </div>

      {/* Stats Cards */}
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

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, ID, category, or price..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12">Loading products...</div>
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
          <div className="text-blue-600 font-medium mt-1">Rs. {product.price?.toLocaleString()}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t">
        <div>
          <div className="text-xs text-gray-500">CATEGORY:</div>
          <div className="text-sm font-medium">{product.categories?.name || 'Uncategorized'}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">STOCK:</div>
          <div className="text-sm font-medium">{product.stock || 0} units</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">ADDED:</div>
          <div className="text-sm">
            {product.created_at ? new Date(product.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">UUID:</div>
          <div className="text-sm font-mono">{product.id.slice(0,8)}...</div>
        </div>
      </div>
    </div>
  )
}
