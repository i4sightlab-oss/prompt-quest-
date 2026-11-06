-- PROMPT QUEST: run this entire script in Supabase > SQL Editor.
-- It creates one session and six teams. Change the session/team codes before sharing.

create extension if not exists pgcrypto;

create table if not exists public.pq_sessions (
  id uuid primary key default gen_random_uuid(),
  session_name text not null default 'PROMPT QUEST - Teacher Training',
  join_code text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.pq_teams (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.pq_sessions(id) on delete cascade,
  team_name text not null,
  team_code text not null,
  score integer not null default 0,
  completed_stages text[] not null default '{}',
  created_at timestamptz not null default now(),
  unique(session_id, team_code),
  unique(session_id, team_name)
);

create table if not exists public.pq_final_prompts (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null unique references public.pq_teams(id) on delete cascade,
  session_id uuid not null references public.pq_sessions(id) on delete cascade,
  prompt_text text not null,
  created_at timestamptz not null default now()
);

alter table public.pq_sessions enable row level security;
alter table public.pq_teams enable row level security;
alter table public.pq_final_prompts enable row level security;

drop policy if exists "public can read active sessions" on public.pq_sessions;
create policy "public can read active sessions" on public.pq_sessions
for select to anon using (is_active = true);

drop policy if exists "public can read teams" on public.pq_teams;
create policy "public can read teams" on public.pq_teams
for select to anon using (true);

drop policy if exists "public can save final prompts" on public.pq_final_prompts;
create policy "public can save final prompts" on public.pq_final_prompts
for insert to anon with check (true);

drop policy if exists "public can update final prompts" on public.pq_final_prompts;
create policy "public can update final prompts" on public.pq_final_prompts
for update to anon using (true) with check (true);

create or replace function public.pq_award_points(
  p_session_code text,
  p_team_code text,
  p_stage_id text,
  p_points integer
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team public.pq_teams%rowtype;
  v_session_id uuid;
  v_allowed text[] := array['role','context','task','clarity','constraints','output'];
begin
  if p_stage_id <> all(v_allowed) then
    raise exception 'Unknown stage';
  end if;
  if p_points not in (10, 15) then
    raise exception 'Invalid points';
  end if;

  select id into v_session_id
  from public.pq_sessions
  where join_code = upper(trim(p_session_code)) and is_active = true;

  if v_session_id is null then raise exception 'Session not found'; end if;

  select * into v_team
  from public.pq_teams
  where session_id = v_session_id and team_code = upper(trim(p_team_code))
  for update;

  if v_team.id is null then raise exception 'Team not found'; end if;

  if not (p_stage_id = any(v_team.completed_stages)) then
    update public.pq_teams
    set score = score + p_points,
        completed_stages = array_append(completed_stages, p_stage_id)
    where id = v_team.id
    returning * into v_team;
  end if;

  return json_build_object(
    'score', v_team.score,
    'completed_stages', to_json(v_team.completed_stages)
  );
end;
$$;

grant execute on function public.pq_award_points(text,text,text,integer) to anon, authenticated;

-- Create your session and six teams. Replace codes with your own before running.
insert into public.pq_sessions (session_name, join_code)
values ('PROMPT QUEST - ENABLE Training', 'AZHAR26')
on conflict (join_code) do nothing;

insert into public.pq_teams (session_id, team_name, team_code)
select s.id, v.team_name, v.team_code
from public.pq_sessions s
cross join (values
  ('Team 1', 'TEAM01'),
  ('Team 2', 'TEAM02'),
  ('Team 3', 'TEAM03'),
  ('Team 4', 'TEAM04'),
  ('Team 5', 'TEAM05'),
  ('Team 6', 'TEAM06')
) as v(team_name, team_code)
where s.join_code = 'AZHAR26'
on conflict (session_id, team_code) do nothing;