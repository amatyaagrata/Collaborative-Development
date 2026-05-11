import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase configuration");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  const { error } = await supabase.rpc('exec_sql', {
    query: `
      ALTER TABLE public.access_requests 
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
      
      CREATE INDEX IF NOT EXISTS idx_access_requests_org_id ON public.access_requests(organization_id);
    `
  });

  if (error) {
    console.error("RPC exec_sql failed, trying REST API via postgres functions or direct schema change isn't possible from client. You must run this SQL manually in Supabase Dashboard:");
    console.log(`
      ALTER TABLE public.access_requests 
      ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
      
      CREATE INDEX IF NOT EXISTS idx_access_requests_org_id ON public.access_requests(organization_id);
    `);
  } else {
    console.log("Migration successful");
  }
}

runMigration();
