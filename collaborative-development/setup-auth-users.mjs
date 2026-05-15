import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bggcfpcbovmygvklnlwa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZ2NmcGNib3ZteWd2a2xubHdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY2MzIyMiwiZXhwIjoyMDkxMjM5MjIyfQ.agw8WtxibQEBc0n0Qdp8RwSfcTSg2suAW5W7CUzQpVc';

if (!supabaseServiceKey) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const STORE_ORG_ID = 'b911ea5f-0ebb-4b8c-a76f-0c1e791bb980';
const CAFE_ORG_ID = '82cb67a5-ee50-4caa-8c58-ad241cf16161';

const users = [
  // ========== ALL-IN-ONE STORE USERS ==========
  { email: 'admin@allinonestore.com', password: 'StoreAdmin2025!', name: 'Store Manager', role: 'admin', org_id: STORE_ORG_ID },
  { email: 'inventory@allinonestore.com', password: 'Inventory2025!', name: 'John Inventory', role: 'inventory_manager', org_id: STORE_ORG_ID },
  { email: 'cashier@allinonestore.com', password: 'Cashier2025!', name: 'Sarah Cashier', role: 'cashier', org_id: STORE_ORG_ID },
  { email: 'driver@allinonestore.com', password: 'Driver2025!', name: 'Mike Driver', role: 'driver', org_id: STORE_ORG_ID },

  // Store Suppliers
  { email: 'supplier@techdistro.com', password: 'Supplier2025!', name: 'TechDistro Rep', role: 'supplier', org_id: STORE_ORG_ID },
  { email: 'supplier@fashionhub.com', password: 'Supplier2025!', name: 'FashionHub Rep', role: 'supplier', org_id: STORE_ORG_ID },
  { email: 'supplier@homeappliances.com', password: 'Supplier2025!', name: 'HomeAppliances Rep', role: 'supplier', org_id: STORE_ORG_ID },
  { email: 'supplier@toyworld.com', password: 'Supplier2025!', name: 'ToyWorld Rep', role: 'supplier', org_id: STORE_ORG_ID },

  // ========== CAFE USERS ==========
  { email: 'admin@cafe.com', password: 'CafeAdmin2025!', name: 'Cafe Owner', role: 'admin', org_id: CAFE_ORG_ID },
  { email: 'inventory@cafe.com', password: 'Inventory2025!', name: 'Emma Inventory', role: 'inventory_manager', org_id: CAFE_ORG_ID },
  { email: 'cashier@cafe.com', password: 'Cashier2025!', name: 'Lisa Cashier', role: 'cashier', org_id: CAFE_ORG_ID },
  { email: 'driver@cafe.com', password: 'Driver2025!', name: 'Alex Driver', role: 'driver', org_id: CAFE_ORG_ID },
  { email: 'supplier@beanmaster.com', password: 'Supplier2025!', name: 'BeanMaster Rep', role: 'supplier', org_id: CAFE_ORG_ID },
];

async function createAuthUsers() {
  console.log('Creating Auth users...\n');

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const user of users) {
    try {
      console.log(`Processing: ${user.email}...`);

      // Check if user exists
      const { data: existingUsers } = await supabase.auth.admin.listUsers();
      const exists = existingUsers.users.find(u => u.email === user.email);

      if (exists) {
        // Update existing user
        const { error } = await supabase.auth.admin.updateUserById(
          exists.id,
          {
            password: user.password,
            email_confirm: true,
            user_metadata: {
              name: user.name,
              role: user.role,
              org_id: user.org_id
            }
          }
        );

        if (error) throw error;

        console.log(`  Updated: ${user.email}`);
        updated++;
      } else {
        // Create new user
        const { data, error } = await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            name: user.name,
            role: user.role,
            org_id: user.org_id
          }
        });

        if (error) throw error;

        console.log(`  Created: ${user.email}`);
        created++;
      }

      // Also update/create in public.users
      const { error: userTableError } = await supabase
        .from('users')
        .upsert({
          email: user.email,
          name: user.name,
          role: user.role,
          org_id: user.org_id,
          is_active: true,
          is_approved: true
        }, { onConflict: 'email' });

      if (userTableError) {
        console.log(`  Warning: Could not update users table: ${userTableError.message}`);
      }

    } catch (error) {
      console.error(`  Failed: ${user.email}`, error.message);
      failed++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`\nSummary:`);
  console.log(`   Created: ${created}`);
  console.log(`   Updated: ${updated}`);
  console.log(`   Failed: ${failed}`);
  console.log(`   Total users: ${users.length}`);

  console.log('\nSetup complete! You can now login with these credentials:\n');
  console.log('Store Admin: admin@allinonestore.com / StoreAdmin2025!');
  console.log('Cafe Admin: admin@cafe.com / CafeAdmin2025!');
  console.log('\nLogin at: http://localhost:3000/login');
}

createAuthUsers();