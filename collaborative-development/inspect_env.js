const fs = require('fs');
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
console.log("Keys:", Object.keys(env));
// Let's check if we have DATABASE_URL or SUPABASE_DB_URL
console.log("DATABASE_URL exists:", !!env.DATABASE_URL);
console.log("SUPABASE_DB_URL exists:", !!env.SUPABASE_DB_URL);
