-- Second Supabase slice — allow users to create/update their own profile after sign-up.

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());
