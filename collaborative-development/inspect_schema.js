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

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectSchema() {
  console.log("=== Inspecting Stock Movements Schema ===");
  const { data: cols, error: colsErr } = await supabase
    .rpc('get_table_columns', { table_name: 'stock_movements' }); // wait, if there's no RPC, we can query information_schema

  // Let's run a raw query using Supabase sql or query information_schema via a postgres endpoint if available, 
  // or we can select one row from stock_movements and see its keys.
  const { data: smData, error: smErr } = await supabase
    .from('stock_movements')
    .select('*')
    .limit(1);
  
  if (smErr) {
    console.log("Error querying stock_movements:", smErr);
  } else {
    console.log("One row from stock_movements:", smData);
  }

  // Also let's check one row from products
  const { data: prodData, error: prodErr } = await supabase
    .from('products')
    .select('*')
    .limit(1);
  
  if (prodErr) {
    console.log("Error querying products:", prodErr);
  } else {
    console.log("One row from products:", prodData);
  }

  // Let's check the schema of purchase_orders
  const { data: poData, error: poErr } = await supabase
    .from('purchase_orders')
    .select('*')
    .limit(1);
  
  if (poErr) {
    console.log("Error querying purchase_orders:", poErr);
  } else {
    console.log("One row from purchase_orders:", poData);
  }
}

inspectSchema();
