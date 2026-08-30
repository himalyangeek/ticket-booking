-- Profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  username text unique not null,
  is_scanner boolean not null default false,
  created_at timestamptz not null default now()
);

-- Programs
create table programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric(10,2) not null,
  created_at timestamptz not null default now()
);

-- Program slots
create table program_slots (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity integer not null,
  available_capacity integer not null,
  created_at timestamptz not null default now(),
  constraint available_capacity_within_bounds check (available_capacity >= 0 and available_capacity <= capacity)
);

-- Tickets
create table tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text unique not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  program_id uuid not null references programs(id),
  slot_id uuid not null references program_slots(id),
  passenger_count integer not null,
  amount numeric(10,2) not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'USED', 'CANCELLED', 'EXPIRED')),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index tickets_user_id_idx on tickets(user_id);
create index tickets_status_idx on tickets(status);

-- Scan events (audit log)
create table ticket_scan_events (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid references tickets(id),
  scanner_user_id uuid references auth.users(id),
  result text not null check (result in ('VALID', 'INVALID')),
  reason text,
  scanned_at timestamptz not null default now()
);

create index ticket_scan_events_ticket_id_idx on ticket_scan_events(ticket_id);

-- Row Level Security
alter table profiles enable row level security;
alter table programs enable row level security;
alter table program_slots enable row level security;
alter table tickets enable row level security;
alter table ticket_scan_events enable row level security;

-- profiles: users manage their own profile row
create policy "profiles_select_own" on profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);

-- programs & slots: publicly readable, no client writes (managed via dashboard/service role)
create policy "programs_select_all" on programs for select using (true);
create policy "program_slots_select_all" on program_slots for select using (true);

-- tickets: users can read their own tickets only; no client-side insert/update/delete —
-- all mutations go through Edge Functions using the service role key.
create policy "tickets_select_own" on tickets for select using (auth.uid() = user_id);

-- scan events: not exposed to clients directly; Edge Functions use the service role key.

-- Auto-create a profile row whenever a new auth user signs up.
create function handle_new_user() returns trigger as $$
begin
  insert into profiles (id, full_name, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1) || '_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- profiles_update_own lets a user edit their own row, but is_scanner must only ever
-- be granted by an administrator (via the service role), never by the user themselves.
create function prevent_self_scanner_promotion() returns trigger as $$
begin
  if new.is_scanner is distinct from old.is_scanner and auth.role() <> 'service_role' then
    raise exception 'is_scanner can only be changed by an administrator';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger profiles_prevent_self_scanner_promotion
  before update on profiles
  for each row execute function prevent_self_scanner_promotion();
