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

async function checkConstraint() {
  console.log("=== Checking stock_movements constraints ===");
  
  const query = `
    SELECT 
      conname, 
      pg_get_constraintdef(c.oid) as condef
    FROM 
      pg_constraint c 
      JOIN pg_namespace n ON n.oid = c.connamespace 
    WHERE 
      conrelid = 'stock_movements'::regclass;
  `;

  // We can query this by executing raw sql via postgrest if we have a function,
  // or we can inspect where stock movements are created in the API.
  // Wait, let's write a database query using postgres/rpc, but we don't have a direct sql rpc.
  // Let's see if we can find any file containing 'stock_movements' in app/api to see how it's inserted.
}

// Instead of raw sql, let's list all files in app/api and components to see how stock_movements are populated.
checkConstraint();
