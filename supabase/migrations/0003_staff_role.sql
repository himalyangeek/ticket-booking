-- Replace the two independent is_admin/is_scanner flags with a single staff
-- designation. ADMIN can do everything TICKET_CHECKER can (scan tickets) plus
-- view the full booking dashboard; TICKET_CHECKER can only scan.
alter table profiles add column role text;

update profiles set role = case
  when is_admin then 'ADMIN'
  else 'TICKET_CHECKER'
end;

alter table profiles alter column role set not null;
alter table profiles alter column role set default 'TICKET_CHECKER';
alter table profiles add constraint profiles_role_check check (role in ('ADMIN', 'TICKET_CHECKER'));

drop policy tickets_select_admin on tickets;

create or replace function prevent_self_scanner_promotion() returns trigger as $$
begin
  if new.role is distinct from old.role and auth.role() <> 'service_role' then
    raise exception 'role can only be changed by an administrator';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

alter table profiles drop column is_admin;
alter table profiles drop column is_scanner;

create policy "tickets_select_admin" on tickets for select using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'ADMIN')
);
