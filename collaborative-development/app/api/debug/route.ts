import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: users } = await supabase.from('users').select('id, email, role, organization_id, auth_user_id');
  const { data: roles } = await supabase.from('user_roles').select('*');
  const { data: suppliers } = await supabase.from('suppliers').select('*');
  const { data: orders } = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5);

  const { data: testQuery, error: testError } = await supabase
    .from('orders')
    .select(`
      *,
      order_items ( id, quantity, unit_price, total_price, products:product_id (name) ),
      organizations:organization_id ( id, name, address, phone, email )
    `)
    .limit(1);

  // Raw query to get constraint names is not easily possible via supabase js, 
  // but we can just use `transporter:transporter_id(name)` if there's no ambiguity, 
  // or we can just fetch without it to prove it's the issue.

  return NextResponse.json({
    testError: testError ? testError.message : null,
    testQuery,
    users: users?.slice(0, 10),
    roles: roles?.slice(0, 10),
    orders: orders?.slice(0, 5)
  });
}
