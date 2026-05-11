import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function repairUser() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const email = "np03cs4a240052@heraldcollege.edu.np";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing env variables.");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log(`Searching for user: ${email}...`);
  
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error("Error listing users:", listError);
    return;
  }

  const authUser = users.find(u => u.email === email);

  if (!authUser) {
    console.error("Could not find user in Auth system.");
    return;
  }

  console.log("Found user in Auth! ID:", authUser.id);

  let { data: org } = await supabase
    .from("organizations")
    .select("id")
    .eq("name", "Gogodam")
    .maybeSingle();

  let orgId = org?.id;

  if (!orgId) {
    console.log("Creating organization 'Gogodam'...");
    const { data: newOrg } = await supabase
      .from("organizations")
      .insert({ name: "Gogodam", slug: "gogodam" })
      .select("id")
      .single();
    orgId = newOrg?.id;
  }

  console.log("Creating/Updating profile in public.users...");
  await supabase.from("users").upsert({
    auth_user_id: authUser.id,
    email: authUser.email,
    name: "GoGODAM",
    role: "admin",
    organization_id: orgId
  });

  console.log("Setting role to admin...");
  await supabase.from("user_roles").upsert({
    user_id: authUser.id,
    role: "admin",
    organization_id: orgId
  });

  console.log("✅ REPAIR COMPLETE! Please try logging in now.");
}

repairUser();
