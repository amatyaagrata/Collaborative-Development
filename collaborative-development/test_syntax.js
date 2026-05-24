const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

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

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function checkOrders() {
  const { data, error } = await supabase
    .from("purchase_orders")
    .select(`
      organizations!org_id(name, address, phone)
    `)
    .limit(1);

  if (error) {
    console.error("Error:", error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

checkOrders();
