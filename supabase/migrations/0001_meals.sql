-- Optional: only needed if you run the app against a real Supabase project
-- (USE_REAL_SUPABASE=1). Paste this into the Supabase SQL editor once.
--
-- It creates the meals table, the CHECK constraint the app relies on, and a default
-- Row-Level-Security posture: RLS is ON and there is NO insert policy for the anon role.
-- That is what makes an anon-key write fail — the exact behaviour the in-memory mock models.

create table if not exists public.meals (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null check (length(name) > 0),
  carb_score integer not null,
  protein_score integer not null,
  fibre_score integer not null,
  fat_score integer not null,
  created_at timestamptz not null default now(),
  constraint meals_scores_range check (
    carb_score between 0 and 5 and
    protein_score between 0 and 5 and
    fibre_score between 0 and 5 and
    fat_score between 0 and 5
  )
);

-- RLS on, no policy granted to anon → the anon key cannot read or write.
-- The service-role key bypasses RLS, which is why writes must use it server-side.
alter table public.meals enable row level security;
