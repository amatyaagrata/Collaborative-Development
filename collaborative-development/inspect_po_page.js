const fs = require('fs');

const path = 'app/(dashboard)/inventory-manager/stock/page.tsx';
const content = fs.readFileSync(path, 'utf8');

console.log("=== Inspecting Purchase Orders Page client logic ===");
const lines = content.split('\n');
lines.forEach((line, index) => {
  if (line.includes('/api/') || line.includes('update') || line.includes('supabase.from') || line.includes('fetch(')) {
    console.log(`Line ${index + 1}: ${line.trim()}`);
  }
});
