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

async function checkStock() {
  const { data: product, error } = await supabase
    .from('products')
    .select('id, name, current_stock')
    .eq('id', '4a88ac63-88e6-4740-9284-67575eb5fd2d')
    .single();
  
  if (error) {
    console.error("Error fetching product:", error);
  } else {
    console.log("Product:", product);
  }

  // Also check movements for this product
  const { data: movements, error: movError } = await supabase
    .from('stock_movements')
    .select('*')
    .eq('product_id', '4a88ac63-88e6-4740-9284-67575eb5fd2d')
    .order('created_at', { ascending: false });

  if (movError) {
    console.error("Error fetching stock movements:", movError);
  } else {
    console.log("Stock movements:", movements);
  }
}

checkStock();
