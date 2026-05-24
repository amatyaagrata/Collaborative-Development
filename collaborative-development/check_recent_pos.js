const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/)?.[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/)?.[1];
  
  const supabase = createClient(url, key);

  // Get recent purchase orders
  const { data: pos } = await supabase
    .from('purchase_orders')
    .select('id, status, stock_updated, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log("Recent POs:", pos);

  if (pos && pos.length > 0) {
      for (const po of pos) {
          const { data: items } = await supabase
              .from('order_items')
              .select('*, product:product_id(name, current_stock, id)')
              .eq('purchase_order_id', po.id);
          console.log(`Items for PO ${po.id}:`, JSON.stringify(items, null, 2));
      }
  }
}

run();
