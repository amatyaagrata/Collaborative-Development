import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function run() {
  const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(2);
  console.log("LAST 2 ORDERS:", JSON.stringify(orders, null, 2));

  const { data: items } = await supabase.from('order_items').select('*').order('created_at', { ascending: false }).limit(2);
  console.log("LAST 2 ORDER_ITEMS:", JSON.stringify(items, null, 2));
}

run();
