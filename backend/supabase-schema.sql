-- ==============================================================================
-- EASYEVENT Supabase Database Schema
-- Copy and run this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql
-- ==============================================================================

-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Users Table
create table if not exists public.users (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  email text not null unique,
  role text not null check (role in ('worker', 'organizer', 'admin')),
  password_hash text not null,
  password_salt text not null,
  available boolean not null default false,
  available_dates jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- 3. Events Table
create table if not exists public.events (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  venue text not null,
  address text not null,
  date text not null,
  time text not null,
  duty text not null,
  required integer not null check (required between 1 and 5000),
  assigned integer not null default 0 check (assigned >= 0),
  status text not null default 'Pending approval' check (status in ('Pending approval', 'Published', 'Rejected')),
  owner_id text references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- 4. Staffing Requests Table
create table if not exists public.staffing_requests (
  id text primary key default gen_random_uuid()::text,
  event_id text not null references public.events(id) on delete cascade,
  organizer_id text not null references public.users(id) on delete cascade,
  quantity integer not null check (quantity between 1 and 500),
  duty text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected', 'Cancelled')),
  created_at text not null default to_char(now(), 'YYYY-MM-DD')
);

-- 5. Shifts Table
create table if not exists public.shifts (
  id text primary key default gen_random_uuid()::text,
  worker_id text references public.users(id) on delete set null,
  event_id text references public.events(id) on delete cascade,
  title text not null,
  venue text not null,
  address text not null,
  date text not null,
  reporting text not null,
  end_time text not null,
  duty text not null,
  supervisor text not null,
  status text not null default 'Assigned' check (status in ('Assigned', 'Accepted', 'Reporting', 'Completed', 'Cancelled')),
  created_at timestamptz not null default now()
);

-- 6. Sessions Table (for secure session authentication)
create table if not exists public.sessions (
  token_hash text primary key,
  user_id text not null references public.users(id) on delete cascade,
  expires_at bigint not null
);

-- 7. Indexes for High Performance
create index if not exists idx_events_owner on public.events(owner_id);
create index if not exists idx_events_status on public.events(status);
create index if not exists idx_requests_organizer on public.staffing_requests(organizer_id);
create index if not exists idx_shifts_worker on public.shifts(worker_id);
create index if not exists idx_sessions_expiry on public.sessions(expires_at);

-- 8. Seed Default Bengaluru Events (if not already populated)
insert into public.events (id, title, venue, address, date, time, duty, required, assigned, status)
values
  ('city-lights', 'City Lights Cultural Night', 'Palace Grounds', 'Jayamahal Road, Vasanth Nagar, Bengaluru, Karnataka 560006', '2026-11-14', '16:00', 'Ushering', 28, 16, 'Published'),
  ('makers-market', 'The Makers Weekend', 'Whitefield Convention Centre', 'Whitefield Main Road, Bengaluru, Karnataka 560066', '2026-11-28', '08:00', 'Guest relations', 18, 10, 'Published'),
  ('food-stories', 'Food Stories Festival', 'Jayamahal Palace', 'Jayamahal Road, Bengaluru, Karnataka', '2026-12-12', '11:00', 'Catering support', 22, 15, 'Published'),
  ('design-meet', 'Design & Ideas Forum', 'BIEC Convention Centre', 'Bengaluru, Karnataka', '2027-01-09', '09:00', 'AV & technical support', 14, 8, 'Published'),
  ('community-run', 'Good Morning Bengaluru Run', 'Cubbon Park', 'Kasturba Road, Bengaluru, Karnataka 560001', '2026-11-22', '05:30', 'Crowd guidance', 16, 12, 'Published'),
  ('winter-conference', 'Bengaluru Business Exchange', 'Bengaluru International Exhibition Centre', 'Bengaluru, Karnataka', '2026-12-19', '07:30', 'Registration & check-in', 32, 19, 'Published')
on conflict (id) do nothing;

-- 9. Seed Default Shifts
insert into public.shifts (id, title, venue, address, date, reporting, end_time, duty, supervisor, status)
values
  ('worker-city-lights', 'City Lights Cultural Night', 'Palace Grounds', 'Jayamahal Road, Vasanth Nagar, Bengaluru, Karnataka 560006', '2026-11-14', '4:00 PM', '10:00 PM', 'Ushering', 'Pradeep (Lead Supervisor)', 'Assigned'),
  ('worker-makers-market', 'The Makers Weekend', 'KTPO Convention Centre', 'Whitefield Main Road, Bengaluru, Karnataka 560066', '2026-11-28', '8:00 AM', '3:00 PM', 'Guest relations', 'Sarah (Floor Lead)', 'Assigned'),
  ('worker-community-run', 'Good Morning Bengaluru Run', 'Cubbon Park', 'Kasturba Road, Bengaluru, Karnataka 560001', '2026-10-18', '5:30 AM', '10:00 AM', 'Guest relations', 'Karthik (Race Coordinator)', 'Completed')
on conflict (id) do nothing;

-- 10. Enable Row Level Security (RLS)
alter table public.events enable row level security;
alter table public.shifts enable row level security;
alter table public.staffing_requests enable row level security;
alter table public.users enable row level security;

-- Policies for public reading of published events
create policy "Allow public read access to published events"
  on public.events for select
  using (status = 'Published');

-- Policies for service role and backend full access
create policy "Service role full access on events"
  on public.events for all
  using (true);

create policy "Service role full access on shifts"
  on public.shifts for all
  using (true);

create policy "Service role full access on staffing_requests"
  on public.staffing_requests for all
  using (true);

create policy "Service role full access on users"
  on public.users for all
  using (true);

