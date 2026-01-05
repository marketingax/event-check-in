// This script will connect to your Supabase project and create all required tables for the event check-in system using the checkin_ prefix.
// Usage: node supabase-setup.js

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://vfjfmhmeyskxnzlskafz.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmamZtaG1leXNreG56bHNrYWZ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzUxOTYzNywiZXhwIjoyMDc5MDk1NjM3fQ.KTf5uWnOk5ge7Po-kZ0HaC9Vv0aYAnb384dA0tvZU8Q';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const schemaSql = `
-- Organizations (multi-tenant)
create table if not exists checkin_organization (
  org_id uuid primary key default gen_random_uuid(),
  org_name text not null,
  ghl_location_id text not null,
  ghl_webhook_secret text not null,
  subscription_plan text,
  created_at timestamptz default now()
);

-- Events
create table if not exists checkin_event (
  event_id uuid primary key default gen_random_uuid(),
  org_id uuid references checkin_organization(org_id) on delete cascade,
  name text not null,
  date date not null,
  start_time time,
  end_time time,
  ghl_product_id text,
  status text check (status in ('upcoming','live','ended')) not null default 'upcoming',
  capacity int,
  check_in_mode text default 'hybrid',
  created_at timestamptz default now()
);

-- Orders
create table if not exists checkin_order (
  order_id text primary key,
  org_id uuid references checkin_organization(org_id) on delete cascade,
  event_id uuid references checkin_event(event_id) on delete cascade,
  buyer_contact_id text,
  buyer_name text,
  buyer_email text,
  total_tickets_purchased int not null,
  tickets_checked_in_count int default 0,
  order_status text check (order_status in ('active','refunded','voided')) not null default 'active',
  created_at timestamptz default now()
);

-- Tickets
create table if not exists checkin_ticket (
  ticket_id uuid primary key default gen_random_uuid(),
  org_id uuid references checkin_organization(org_id) on delete cascade,
  order_id text references checkin_order(order_id) on delete cascade,
  event_id uuid references checkin_event(event_id) on delete cascade,
  assigned_contact_id text,
  assigned_name text,
  assigned_email text,
  qr_token text unique not null,
  checked_in_at timestamptz,
  checked_in_by text,
  check_in_device_id text,
  created_at timestamptz default now()
);

-- Guests
create table if not exists checkin_guest (
  guest_id uuid primary key default gen_random_uuid(),
  org_id uuid references checkin_organization(org_id) on delete cascade,
  event_id uuid references checkin_event(event_id) on delete cascade,
  ticket_id uuid references checkin_ticket(ticket_id) on delete set null,
  name text,
  email text,
  contact_id text,
  created_at timestamptz default now()
);

-- Staff & Roles
create table if not exists checkin_staff (
  staff_user_id uuid primary key default gen_random_uuid(),
  org_id uuid references checkin_organization(org_id) on delete cascade,
  email text not null,
  name text,
  role text check (role in ('admin','door_staff')) not null,
  is_active boolean default true,
  invited_at timestamptz default now(),
  disabled_at timestamptz
);

-- Audit Logs
create table if not exists checkin_audit_log (
  log_id uuid primary key default gen_random_uuid(),
  org_id uuid references checkin_organization(org_id) on delete cascade,
  event_id uuid references checkin_event(event_id) on delete set null,
  ticket_id uuid references checkin_ticket(ticket_id) on delete set null,
  staff_user_id uuid references checkin_staff(staff_user_id) on delete set null,
  device_id text,
  action text not null,
  timestamp timestamptz default now()
);
`;

async function main() {
  try {
    const { error } = await supabase.rpc('execute_sql', { sql: schemaSql });
    if (error) {
      console.error('Error running schema SQL:', error);
    } else {
      console.log('Schema created successfully!');
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

main();
