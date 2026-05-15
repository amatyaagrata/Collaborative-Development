import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bggcfpcbovmygvklnlwa.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJnZ2NmcGNib3ZteWd2a2xubHdhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTY2MzIyMiwiZXhwIjoyMDkxMjM5MjIyfQ.agw8WtxibQEBc0n0Qdp8RwSfcTSg2suAW5W7CUzQpVc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const usersToFix = [
  'admin@allinonestore.com',
  'inventory@allinonestore.com',
  'cashier@allinonestore.com',
  'driver@allinonestore.com',
  'supplier@techdistro.com',
  'supplier@fashionhub.com',
  'supplier@homeappliances.com',
  'supplier@toyworld.com',
  'admin@cafe.com',
  'inventory@cafe.com',
  'cashier@cafe.com',
  'driver@cafe.com',
  'supplier@beanmaster.com',
];

const passwords = {
  'admin@allinonestore.com': 'StoreAdmin2025!',
  'admin@cafe.com': 'CafeAdmin2025!',
  'inventory@allinonestore.com': 'Inventory2025!',
  'inventory@cafe.com': 'Inventory2025!',
  'cashier@allinonestore.com': 'Cashier2025!',
  'cashier@cafe.com': 'Cashier2025!',
  'driver@allinonestore.com': 'Driver2025!',
  'driver@cafe.com': 'Driver2025!',
  'supplier@techdistro.com': 'Supplier2025!',
  'supplier@fashionhub.com': 'Supplier2025!',
  'supplier@homeappliances.com': 'Supplier2025!',
  'supplier@toyworld.com': 'Supplier2025!',
  'supplier@beanmaster.com': 'Supplier2025!',
};

async function resetPasswords() {
  console.log('🔑 Resetting passwords for all users...\n');
  
  // First, get all users
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }
  
  console.log(`Found ${users.length} users in Auth\n`);
  
  for (const user of users) {
    const email = user.email;
    const newPassword = passwords[email];
    
    if (newPassword) {
      console.log(`Resetting password for: ${email}`);
      
      const { error } = await supabase.auth.admin.updateUserById(
        user.id,
        { password: newPassword }
      );
      
      if (error) {
        console.log(`  ❌ Failed: ${error.message}`);
      } else {
        console.log(`  ✅ Password reset for ${email}`);
      }
    }
  }
  
  console.log('\n✅ Password reset complete!');
}

resetPasswords();