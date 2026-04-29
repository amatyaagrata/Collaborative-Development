"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Pencil, Trash2, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

/**
 * Product interface based on backend structure
 */
interface Product {
  id: number;
  name: string;
  category_id?: string | null;
  categories?: { name?: string }[] | { name?: string } | null;
  price: number;
  stock: number;
  created_at?: string;
}

/**
 * Helper to get category name safely
 */
function getCategoryName(product: Product): string {
  if (Array.isArray(product.categories)) {
    return product.categories[0]?.name || "General";
  }
  return product.categories?.name || "General";
}

export default function ProductPage() {
  const supabase = createClient();

  /**
   * UI state
   */
  const [viewMode, setViewMode] = useState<"list" | "form">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  /**
   * Product data
   */
  const [products, setProducts] = useState<Product[]>([]);

  /**
   * Form state
   */
  const [formMode, setFormMode] = useState<"add" | "edit">("add");
  const [editingId, setEditingId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock: "",
  });

  /**
   * Fetch products from Supabase
   */
  const fetchProducts = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("*, categories:category_id (name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch products");
    } else {
      setProducts(data || []);
    }

    setLoading(false);
  };

  /**
   * Load products on page load
   */
  useEffect(() => {
    fetchProducts();
  }, []);

  /**
   * Filter products based on search
   */
  const filteredProducts = useMemo(() => {
    return products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getCategoryName(p).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [products, searchQuery]);

  /**
   * Open add form
   */
  const handleAddClick = () => {
    setFormMode("add");
    setFormData({ name: "", price: "", stock: "" });
    setViewMode("form");
  };

  /**
   * Open edit form
   */
  const handleEditClick = (product: Product) => {
    setFormMode("edit");
    setEditingId(product.id);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      stock: product.stock.toString(),
    });
    setViewMode("form");
  };

  /**
   * Save product
   */
  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Product name is required");
      return;
    }

    const payload = {
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      stock: parseInt(formData.stock) || 0,
    };

    if (formMode === "add") {
      const { error } = await supabase.from("products").insert([payload]);
      if (error) return toast.error("Error adding product");
      toast.success("Product added");
    }

    if (formMode === "edit" && editingId !== null) {
      const { error } = await supabase
        .from("products")
        .update(payload)
        .eq("id", editingId);

      if (error) return toast.error("Error updating product");
      toast.success("Product updated");
    }

    setViewMode("list");
    fetchProducts();
  };

  /**
   * Delete product
   */
  const handleDelete = async (id: number) => {
    if (!confirm("Delete this product?")) return;

    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) {
      toast.error("Delete failed");
    } else {
      toast.success("Product deleted");
      fetchProducts();
    }
  };

  return (
    <AppLayout title="Product">
      <div style={containerStyle}>

        {viewMode === "list" && (
          <>
            {/* Header */}
            <div style={headerStyle}>
              <h3>All product</h3>
              <button onClick={handleAddClick} style={addButtonStyle}>
                <Plus size={18} /> Add now
              </button>
            </div>

            {/* Search */}
            <div style={searchWrapper}>
              <Search size={18} style={searchIcon} />
              <input
                style={searchInput}
                placeholder="Search products"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Table */}
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5}>Loading...</td>
                  </tr>
                ) : filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={5}>No products found</td>
                  </tr>
                ) : (
                  filteredProducts.map((p) => (
                    <tr key={p.id}>
                      <td>{p.name}</td>
                      <td>{getCategoryName(p)}</td>
                      <td>Rs {p.price}</td>
                      <td>{p.stock}</td>
                      <td>
                        <Pencil onClick={() => handleEditClick(p)} />
                        <Trash2 onClick={() => handleDelete(p.id)} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </>
        )}

        {viewMode === "form" && (
          <div>
            <h3>Product details</h3>

            <input
              placeholder="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />

            <input
              placeholder="Price"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: e.target.value })
              }
            />

            <input
              placeholder="Stock"
              type="number"
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: e.target.value })
              }
            />

            <button onClick={() => setViewMode("list")}>Cancel</button>
            <button onClick={handleSave}>Save</button>
          </div>
        )}

      </div>
    </AppLayout>
  );
}

/**
 * Styles
 */
const containerStyle: React.CSSProperties = {
  background: "white",
  padding: "30px",
  borderRadius: "10px",
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "20px",
};

const addButtonStyle: React.CSSProperties = {
  background: "#6B21FF",
  color: "white",
  padding: "10px",
  borderRadius: "8px",
};

const searchWrapper: React.CSSProperties = {
  position: "relative",
  marginBottom: "20px",
};

const searchInput: React.CSSProperties = {
  width: "100%",
  padding: "10px 10px 10px 40px",
};

const searchIcon: React.CSSProperties = {
  position: "absolute",
  left: "10px",
  top: "10px",
};

const tableStyle: React.CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};