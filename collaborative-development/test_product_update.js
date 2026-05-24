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

async function testProductUpdate() {
  console.log("=== Testing Product Stock Update ===");
  
  const productId = '4a88ac63-88e6-4740-9284-67575eb5fd2d';
  
  const { data, error } = await supabase
    .from('products')
    .update({ current_stock: 41 })
    .eq('id', productId)
    .select();
  
  if (error) {
    console.error("Error updating product stock:", error);
  } else {
    console.log("Success updating product stock:", data);
  }
}

testProductUpdate();
