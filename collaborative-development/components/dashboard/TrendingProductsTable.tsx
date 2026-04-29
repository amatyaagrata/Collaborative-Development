"use client";

import React from "react";
import type { Product } from "@/lib/supabase/hooks/useProducts";

interface TrendingProductsTableProps {
  products: Product[];
}

export function TrendingProductsTable({ products }: TrendingProductsTableProps) {
  return (
    <div className="chart-card trending-card" style={{ animationDelay: "250ms" }}>
      <div className="trending-header">
        <h3 className="chart-card-title">Trending Products</h3>
      </div>
      <div className="trending-table-wrapper">
        <table className="trending-table">
          <thead>
            <tr>
              <th></th>
              <th>Product</th>
              <th>Supplier</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td><div className="product-avatar"></div></td>
                <td className="font-medium">{product.name}</td>
                <td>{product.suppliers?.name || 'Unknown'}</td>
                <td className="text-muted">{product.id.slice(0, 8)}</td>
                <td>{product.categories?.name || 'Uncategorized'}</td>
                <td>Rs. {product.price.toLocaleString()}</td>
                <td>{product.stock}</td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">No products yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
