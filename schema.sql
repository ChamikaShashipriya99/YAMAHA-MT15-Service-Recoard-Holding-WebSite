-- Create the service_records table
create table service_records (
  id uuid default gen_random_uuid() primary key,
  date date not null,
  mileage integer not null,
  oil_change boolean default false,
  filter_change boolean default false,
  notes text,
  cost text,
  type text,
  created_at timestamp with time zone default now()
);

-- Set up Row Level Security (RLS)
-- For now, we'll allow public access since we haven't implemented Auth fully yet.
-- In a real app, you'd restrict this to authenticated users.
alter table service_records enable row level security;

create policy "Enable read access for all users"
on service_records for select
using (true);

create policy "Enable insert access for all users"
on service_records for insert
with check (true);

create policy "Enable update access for all users"
on service_records for update
using (true);

create policy "Enable delete access for all users"
on service_records for delete
using (true);
