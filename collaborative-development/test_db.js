const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8').split('\n').reduce((acc, line) => {
  const [k, ...v] = line.split('=');
  if(k && v.length) acc[k.trim()] = v.join('=').trim().replace(/['"]/g, '');
  return acc;
}, {});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const { data: users } = await supabase.from('users').select('id, auth_user_id, email, role');
  console.log("USERS:", users);
  
  const { data: suppliers } = await supabase.from('suppliers').select('id, user_id, name, contact_email');
  console.log("SUPPLIERS:", suppliers);
}
run();
