const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Parse .env.local manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(supabaseUrl, supabaseKey);

async function simulatePatch() {
  console.log("=== Simulating PATCH /api/delivery-status ===");
  
  const assignmentId = 'ffd9d3a3-a20b-4399-8eec-22b9e4fcb6e5';
  const orderId = '92dd1236-5dfd-4846-aead-a4c257117389';
  const deliveryStatus = 'delivered';

  console.log("Step 5: Updating order_driver_assignments");
  const { data: updatedAssign, error: updateAssignErr } = await admin
    .from("order_driver_assignments")
    .update({
      status: deliveryStatus,
      responded_at: new Date().toISOString()
    })
    .eq("id", assignmentId)
    .select()
    .single();

  if (updateAssignErr) {
    console.error("Update assignment error:", updateAssignErr);
    return;
  }
  console.log("Updated assignment successfully:", updatedAssign.status);

  console.log("Step 6: Sync purchase order status");
  const poStatus = 'delivered'; // status mapping for 'delivered' is 'delivered'
  const targetPoId = orderId;

  const { error: poErr } = await admin
    .from("purchase_orders")
    .update({ status: poStatus })
    .eq("id", targetPoId);

  if (poErr) {
    console.error("[delivery-status] PO sync error:", poErr);
  } else {
    console.log(`[delivery-status] PO ${targetPoId} status → ${poStatus}`);
  }

  console.log("Step 7: Auto-increment product stock when delivered");
  if (deliveryStatus === "delivered") {
    const { data: orderItems, error: itemsErr } = await admin
      .from("order_items")
      .select("product_id, quantity")
      .eq("purchase_order_id", targetPoId);

    if (itemsErr) {
      console.error("[delivery-status] Failed to fetch order items:", itemsErr);
    } else {
      console.log("Fetched order items:", orderItems);
      if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          if (!item.product_id || !item.quantity) {
            console.log("Skipping item because product_id or quantity is missing:", item);
            continue;
          }

          // Get current stock
          console.log(`Fetching current stock for product ${item.product_id}`);
          const { data: product, error: prodErr } = await admin
            .from("products")
            .select("current_stock")
            .eq("id", item.product_id)
            .single();

          if (prodErr || !product) {
            console.error(`[delivery-status] Failed to get product ${item.product_id}:`, prodErr);
            continue;
          }

          const newStock = (product.current_stock || 0) + item.quantity;
          console.log(`Updating product ${item.product_id} stock to ${newStock}`);

          const { error: stockErr } = await admin
            .from("products")
            .update({ current_stock: newStock })
            .eq("id", item.product_id);

          if (stockErr) {
            console.error(`[delivery-status] Failed to update stock for ${item.product_id}:`, stockErr);
          } else {
            console.log(`[delivery-status] Product ${item.product_id} stock updated successfully: ${product.current_stock} → ${newStock}`);
          }
        }
      }
    }
  }
}

simulatePatch();
