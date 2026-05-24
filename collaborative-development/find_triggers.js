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

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function findTriggers() {
  console.log("=== Listing all triggers in public schema ===");
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT 
        trigger_name, 
        event_object_table, 
        action_statement, 
        action_timing
      FROM information_schema.triggers
      WHERE trigger_schema = 'public';
    `
  });

  if (error) {
    // If exec_sql RPC doesn't exist, we can use standard tables or check if we can query via some other method.
    console.error("RPC exec_sql failed, trying direct select on information_schema (which might fail if RLS / permissions restrict it):", error.message);
    
    // Let's try to querypg_trigger or information_schema using from
    const { data: directData, error: directErr } = await supabase
      .from('pg_trigger')
      .select('*')
      .limit(5);
    console.log("Direct pg_trigger query:", directErr ? directErr.message : directData);
  } else {
    console.log("Triggers:", data);
  }
}

findTriggers();
