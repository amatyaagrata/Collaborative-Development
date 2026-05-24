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

async function printSchema() {
  console.log("=== Querying stock_movements columns ===");
  const { data: cols, error: colsErr } = await supabase.rpc('exec_sql', {
    query: `
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'stock_movements'
      ORDER BY ordinal_position;
    `
  });
  
  if (colsErr) {
    console.error("Error querying columns:", colsErr);
  } else {
    console.log("Columns:", cols);
  }

  console.log("=== Querying stock_movements CHECK constraints ===");
  const { data: constraints, error: constraintsErr } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        conname, 
        pg_get_constraintdef(c.oid) as condef
      FROM 
        pg_constraint c 
      WHERE 
        conrelid = 'stock_movements'::regclass;
    `
  });

  if (constraintsErr) {
    console.error("Error querying constraints:", constraintsErr);
  } else {
    console.log("Constraints:", constraints);
  }
}

printSchema();
