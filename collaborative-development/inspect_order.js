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
// Use service role key to bypass RLS and view everything
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspect() {
  console.log("=== Inspecting database tables ===");
  
  // Find order in purchase_orders
  const { data: poData, error: poErr } = await supabase
    .from('purchase_orders')
    .select('*')
    .ilike('order_number', '%CAFE-20260522-F0C68B%');
  
  console.log("Purchase Orders matches:", poErr ? poErr.message : poData);
  
  // Find order in orders
  const { data: ordData, error: ordErr } = await supabase
    .from('orders')
    .select('*')
    .ilike('order_number', '%CAFE-20260522-F0C68B%');
  
  console.log("Orders matches:", ordErr ? ordErr.message : ordData);

  // If there's a match, inspect its order_items and order_driver_assignments
  if (poData && poData.length > 0) {
    const poId = poData[0].id;
    
    // Check order_items
    const { data: items, error: itemsErr } = await supabase
      .from('order_items')
      .select('*')
      .eq('purchase_order_id', poId);
    
    console.log("Order items (by purchase_order_id):", itemsErr ? itemsErr.message : items);

    const { data: items2, error: itemsErr2 } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', poId);
    
    console.log("Order items (by order_id):", itemsErr2 ? itemsErr2.message : items2);

    // Check order_driver_assignments
    const { data: assigns, error: assignsErr } = await supabase
      .from('order_driver_assignments')
      .select('*')
      .eq('purchase_order_id', poId);
    
    console.log("Assignments:", assignsErr ? assignsErr.message : assigns);
  }
}

inspect();
