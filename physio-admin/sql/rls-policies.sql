-- Run once in Supabase SQL Editor.
alter table public.admins enable row level security;
alter table public.physiotherapists enable row level security;

-- Admins can read their own row (used by the panel's access check)
drop policy if exists "admin reads own row" on public.admins;
create policy "admin reads own row" on public.admins
  for select to authenticated using (user_id = auth.uid());

-- Everyone can view doctors on the public site
drop policy if exists "public read physiotherapists" on public.physiotherapists;
create policy "public read physiotherapists" on public.physiotherapists
  for select to anon, authenticated using (true);

-- Only admins can add, edit or delete doctors
drop policy if exists "admin write physiotherapists" on public.physiotherapists;
create policy "admin write physiotherapists" on public.physiotherapists
  for all to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));
