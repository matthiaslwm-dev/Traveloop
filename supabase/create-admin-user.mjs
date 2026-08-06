// One-off script to create/update the /admin login user in Supabase Auth.
// Run once: node supabase/create-admin-user.mjs
//
// Reads SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_LOGIN_EMAIL from
// .env.local, and the password from the ADMIN_LOGIN_PASSWORD env var (or the
// "admin" default). The /admin login form's "ID" field is always "admin";
// this script sets the real Supabase Auth credential (email + password)
// behind it.

import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  try {
    const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
    for (const line of text.split("\n")) {
      const match = line.match(/^([A-Z_]+)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim();
      }
    }
  } catch {
    // .env.local not found — rely on already-exported env vars.
  }
}

loadEnvLocal();

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_LOGIN_EMAIL ?? "admin@traveloop.internal";
const password = process.env.ADMIN_LOGIN_PASSWORD ?? "admin";

if (!url || !serviceRoleKey) {
  console.error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (.env.local).");
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

const { data: list, error: listError } = await supabase.auth.admin.listUsers();
if (listError) {
  console.error("Failed to list users:", listError.message);
  process.exit(1);
}

const existing = list.users.find((u) => u.email === email);

if (existing) {
  const { error } = await supabase.auth.admin.updateUserById(existing.id, {
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("Failed to update admin user:", error.message);
    process.exit(1);
  }
  console.log(`Updated password for existing admin user (${email}).`);
} else {
  const { error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) {
    console.error("Failed to create admin user:", error.message);
    process.exit(1);
  }
  console.log(`Created admin user (${email}).`);
}
