const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function run() {
  const env = fs.readFileSync('.env.local', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/)?.[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/)?.[1];
  
  const supabase = createClient(url, key);

  const { data: sps, error: err1 } = await supabase.from('supplier_products').select('*');
  if (err1) return console.log("Fetch error:", err1);

  for (const sp of sps) {
    // get category
    const catName = sp.category || 'Supplied Items';
    let { data: cat } = await supabase.from('categories').select('id').eq('org_id', sp.org_id).ilike('name', catName).maybeSingle();
    
    if (!cat) {
      const { data: newCat } = await supabase.from('categories').insert({ org_id: sp.org_id, name: catName }).select('id').single();
      cat = newCat;
    }

    console.log(`Syncing ${sp.name}...`);
    
    // UPSERT into products
    const payload = {
      org_id: sp.org_id,
      category_id: cat.id,
      supplier_id: sp.supplier_id,
      name: sp.name,
      description: 'Auto-synced from supplier catalog',
      selling_price: sp.price,
      current_stock: 0,
      sku: sp.sku
    };

    // Since we don't know if sku is the only constraint, let's just check if it exists by name or sku first
    let query = supabase.from('products').select('id').eq('org_id', sp.org_id);
    if (sp.sku) {
        query = query.eq('sku', sp.sku);
    } else {
        query = query.eq('name', sp.name);
    }
    
    const { data: existing } = await query.maybeSingle();

    if (existing) {
        const { error } = await supabase.from('products').update(payload).eq('id', existing.id);
        if (error) console.log("Update error for", sp.name, error);
        else console.log("Updated", sp.name);
    } else {
        const { error } = await supabase.from('products').insert(payload);
        if (error) console.log("Insert error for", sp.name, error);
        else console.log("Inserted", sp.name);
    }
  }
}

run();
