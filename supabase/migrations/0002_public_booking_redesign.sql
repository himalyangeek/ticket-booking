-- Visitors book without an account; only staff (scanners/admins) have Supabase Auth logins.

-- Admins get the same self-promotion protection as scanners.
alter table profiles add column is_admin boolean not null default false;

create or replace function prevent_self_scanner_promotion() returns trigger as $$
begin
  if (new.is_scanner is distinct from old.is_scanner or new.is_admin is distinct from old.is_admin)
     and auth.role() <> 'service_role' then
    raise exception 'is_scanner/is_admin can only be changed by an administrator';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Forest-range display info for the public catalog.
alter table programs add column forest_range text not null default '';
alter table programs add column highlight_animals text[] not null default '{}';
alter table programs add column animal_emoji text not null default '🐯';

alter table program_slots add column session_label text not null default 'Safari';

-- Tickets are no longer tied to a visitor account — booker details are captured
-- directly on the ticket instead. Aadhaar is sensitive government ID data: only the
-- last 4 digits and a salted hash are ever stored, never the full number.
-- The old "select own tickets" policy depends on user_id, so it must go first.
drop policy tickets_select_own on tickets;
alter table tickets drop constraint tickets_user_id_fkey;
drop index if exists tickets_user_id_idx;
alter table tickets drop column user_id;

alter table tickets add column booker_name text not null default '';
alter table tickets add column booker_mobile text not null default '';
alter table tickets add column aadhaar_last4 text not null default '';
alter table tickets add column aadhaar_hash text not null default '';
alter table tickets add column visit_date date not null default current_date;
alter table tickets add column payment_status text not null default 'PENDING'
  check (payment_status in ('PENDING', 'PAID', 'FAILED'));
alter table tickets add column payment_reference text;

create index tickets_visit_date_idx on tickets(visit_date);
create index tickets_booker_mobile_idx on tickets(booker_mobile);

-- Reads for booking confirmation/lookup go through the find-ticket Edge Function
-- (service role) instead — the only client-side read is for admins.
create policy "tickets_select_admin" on tickets for select using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.is_admin)
);

-- Placeholder Chhattisgarh Forest Department safari ranges, so the booking flow is
-- testable end-to-end before real program data is supplied.
insert into programs (name, description, price, forest_range, highlight_animals, animal_emoji)
values
  ('Barnawapara Morning Safari', 'A dawn jeep safari through sal forest grasslands.', 800.00,
    'Barnawapara Wildlife Sanctuary', array['Leopard', 'Sloth Bear', 'Spotted Deer', 'Wild Boar'], '🐆'),
  ('Udanti Tiger Trail', 'Jeep safari across Udanti''s river valleys and bamboo groves.', 1000.00,
    'Udanti Wildlife Sanctuary', array['Tiger', 'Wild Buffalo', 'Sambar', 'Peacock'], '🐯'),
  ('Achanakmar Forest Drive', 'A biosphere reserve safari through dense sal and bamboo forest.', 900.00,
    'Achanakmar Wildlife Sanctuary', array['Tiger', 'Bison', 'Flying Squirrel', 'Hornbill'], '🐘'),
  ('Guru Ghasidas Wilderness Run', 'Safari through Chhattisgarh''s largest national park.', 950.00,
    'Guru Ghasidas National Park', array['Tiger', 'Chital', 'Nilgai', 'Mugger Crocodile'], '🐊')
on conflict do nothing;

insert into program_slots (program_id, starts_at, ends_at, capacity, available_capacity, session_label)
select p.id, gs.starts_at, gs.starts_at + interval '3 hours', 20, 20, gs.session_label
from programs p
cross join lateral (
  values
    (current_date + 1 + time '06:00', 'Morning Safari'),
    (current_date + 1 + time '15:30', 'Evening Safari'),
    (current_date + 2 + time '06:00', 'Morning Safari'),
    (current_date + 2 + time '15:30', 'Evening Safari'),
    (current_date + 3 + time '06:00', 'Morning Safari'),
    (current_date + 3 + time '15:30', 'Evening Safari')
) as gs(starts_at, session_label)
where p.forest_range <> ''
on conflict do nothing;
