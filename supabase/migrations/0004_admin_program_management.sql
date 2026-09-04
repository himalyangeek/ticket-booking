-- Admins manage the safari catalog (programs + their slots/timings) directly
-- from the dashboard via supabase-js, gated by RLS instead of an Edge Function —
-- reads already work the same way for the tickets_select_admin policy.
create policy "programs_admin_insert" on programs for insert with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'ADMIN')
);
create policy "programs_admin_update" on programs for update using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'ADMIN')
);
create policy "programs_admin_delete" on programs for delete using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'ADMIN')
);

create policy "program_slots_admin_insert" on program_slots for insert with check (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'ADMIN')
);
create policy "program_slots_admin_update" on program_slots for update using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'ADMIN')
);
create policy "program_slots_admin_delete" on program_slots for delete using (
  exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = 'ADMIN')
);
