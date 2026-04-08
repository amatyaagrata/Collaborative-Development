import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Load environment variables manually
const envPath = path.resolve('.env.local');
if (!fs.existsSync(envPath)) {
  console.error("❌ ERROR: .env.local not found in root directory.");
  process.exit(1);
}

const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [k, ...v] = line.split('=');
  if (k && v.length) {
    env[k.trim()] = v.join('=').trim().replace(/^['"]|['"]$/g, '');
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ ERROR: Missing Supabase variables in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const password = "Password123!";
const organization = "GoGodam Corp";

const testUsers = [
  { email: 'admin@gogodam.com', role: 'admin', name: 'Admin User' },
  { email: 'supplier@gogodam.com', role: 'supplier', name: 'Supplier User' },
  { email: 'transporter@gogodam.com', role: 'transporter', name: 'Transporter User' },
  { email: 'manager@gogodam.com', role: 'inventory manager', name: 'Manager User' }
];

async function setup() {
  console.log("🚀 Creating test users for all roles in '" + organization + "'...");

  for (const user of testUsers) {
    console.log(`\nProcessing ${user.email} (${user.role})...`);
    
    // 1. Create or Find User in Auth
    let authUserId;
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers.users.find(u => u.email === user.email);

    if (existing) {
      console.log(`- Found existing user in Auth: ${existing.id}`);
      authUserId = existing.id;
      await supabase.auth.admin.updateUserById(authUserId, { password, email_confirm: true });
    } else {
      console.log(`- Creating new user in Auth...`);
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: password,
        email_confirm: true,
        user_metadata: { name: user.name, role: user.role }
      });
      if (error) {
        console.error("❌ Failed to create user:", error.message);
        continue;
      }
      authUserId = data.user.id;
    }

    // 2. Sync to public.users
    const { error: usersError } = await supabase.from('users').upsert({
      auth_user_id: authUserId,
      email: user.email,
      name: user.name,
      role: user.role,
      organization_name: organization,
      is_active: true
    }, { onConflict: 'email' });

    if (usersError) console.error("❌ Error syncing public.users:", usersError.message);
    else console.log(`- Synced to public.users table`);

    // 3. Sync to public.user_roles
    const { error: rolesError } = await supabase.from('user_roles').upsert({
      user_id: authUserId,
      role: user.role,
      organization_name: organization
    }, { onConflict: 'user_id' });

    if (rolesError) console.error("❌ Error syncing public.user_roles:", rolesError.message);
    else console.log(`- Synced to public.user_roles table`);
  }

  console.log("\n✅ ALL TEST ACCOUNTS CREATED SUCCESSFULLY!");
}

setup();
