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
  const users = await fetchTable('users');
  const roles = await fetchTable('user_roles');
  
  const test2User = users.find(u => u.id === '29b52a4b-0acd-40c9-abc9-17e16504772c');
  console.log("TEST 2 USER:", test2User);
  
  if (test2User) {
    const role = roles.find(r => r.user_id === test2User.auth_user_id);
    console.log("TEST 2 USER ROLE:", role);
  }
}

run();
