import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

async function fetchTable(table) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  return await res.json();
}

async function run() {
  console.log("=== ORDERS ===");
  const orders = await fetchTable('orders');
  console.log(JSON.stringify(orders.slice(0, 3), null, 2));
  
  console.log("\n=== SUPPLIERS ===");
  const suppliers = await fetchTable('suppliers');
  console.log(JSON.stringify(suppliers.slice(0, 3), null, 2));

  console.log("\n=== USER_ROLES ===");
  const roles = await fetchTable('user_roles');
  console.log(JSON.stringify(roles.slice(0, 3), null, 2));
}

run();
