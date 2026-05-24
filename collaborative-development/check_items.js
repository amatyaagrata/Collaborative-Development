const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/)?.[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/)?.[1];
  
  if (!url || !key) return console.error("Missing keys");

  const supabase = createClient(url, key);

  // Get the most recent purchase order
  const { data: pos, error: poErr } = await supabase
    .from('purchase_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(3);
    
  if (poErr) return console.error("PO Error:", poErr);
  
  for (const po of pos) {
    console.log(`PO: ${po.id} | Status: ${po.status} | Updated: ${po.stock_updated}`);
    
    const { data: items, error: itemErr } = await supabase
      .from('order_items')
      .select('*')
      .eq('purchase_order_id', po.id);
      
    if (itemErr) console.error("Item Error:", itemErr);
    else {
      console.log(`  Items (${items.length}):`);
      items.forEach(i => console.log(`    - Product: ${i.product_id} | Qty: ${i.quantity}`));
    }
  }

  // Get the products to see if stock was updated
  const { data: prods } = await supabase.from('products').select('id, current_stock').limit(3);
  console.log("Sample Products:");
  prods.forEach(p => console.log(`  - ${p.id} | Stock: ${p.current_stock}`));
}

run();
