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

const url = env.NEXT_PUBLIC_SUPABASE_URL + '/rest/v1/';
const key = env.SUPABASE_SERVICE_ROLE_KEY;

async function fetchRpcList() {
  console.log("Fetching OpenAPI spec from:", url);
  const res = await fetch(url, {
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  });
  if (!res.ok) {
    console.error("HTTP error:", res.status, await res.text());
    return;
  }
  const spec = await res.json();
  const paths = Object.keys(spec.paths || {});
  console.log("=== Available API Paths ===");
  paths.forEach(p => {
    if (p.startsWith('/rpc/')) {
      console.log(p);
    }
  });
}

fetchRpcList();
