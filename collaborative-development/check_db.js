const { Client } = require('pg');
const fs = require('fs');

async function run() {
  let dbUrl = null;
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    dbUrl = env.match(/DATABASE_URL="([^"]+)"/)?.[1] || env.match(/DATABASE_URL=([^\s]+)/)?.[1];
  } catch(e) {
    console.error("No .env.local found");
    return;
  }
  
  if (!dbUrl) {
    console.error("No DATABASE_URL found");
    return;
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  console.log("--- TRIGGERS ON purchase_orders ---");
  const res1 = await client.query(`
    SELECT t.tgname, t.tgenabled, p.proname, pg_get_triggerdef(t.oid) as def
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE c.relname = 'purchase_orders' AND t.tgisinternal = false;
  `);
  console.log(res1.rows);

  console.log("--- TRIGGERS ON orders ---");
  const res2 = await client.query(`
    SELECT t.tgname, t.tgenabled, p.proname, pg_get_triggerdef(t.oid) as def
    FROM pg_trigger t
    JOIN pg_class c ON t.tgrelid = c.oid
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE c.relname = 'orders' AND t.tgisinternal = false;
  `);
  console.log(res2.rows);

  console.log("--- ORDER ITEMS CHECK ---");
  const res3 = await client.query(`
    SELECT purchase_order_id, product_id, count(*) as count, sum(quantity) as total_qty
    FROM order_items
    WHERE purchase_order_id IS NOT NULL
    GROUP BY purchase_order_id, product_id
    ORDER BY count DESC
    LIMIT 5;
  `);
  console.log(res3.rows);

  await client.end();
}

run();
