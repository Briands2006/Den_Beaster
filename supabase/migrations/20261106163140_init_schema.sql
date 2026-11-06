-- ============ TABELLEN ============

-- Een profiel per ingelogde gebruiker. De id is dezelfde als in Supabase Auth.
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text not null unique default substr(md5(random()::text), 1, 8),
  created_by uuid not null default auth.uid() references public.profiles,
  created_at timestamptz not null default now()
);

-- Koppeltabel: wie zit in welke groep (veel-op-veel)
create table public.group_members (
  group_id uuid references public.groups on delete cascade,
  profile_id uuid references public.profiles on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  primary key (group_id, profile_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups on delete cascade,
  artist text not null,
  venue text,
  city text,
  event_date date not null,
  notes text,
  created_at timestamptz not null default now()
);

create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events on delete cascade,
  buyer_id uuid not null references public.profiles,   -- wie betaalde
  holder_id uuid not null references public.profiles,  -- voor wie het ticket is
  price_cents integer not null check (price_cents >= 0), -- geld altijd in centen!
  ticket_type text,
  reimbursed boolean not null default false,
  reimbursed_at timestamptz,
  created_at timestamptz not null default now()
);

-- ============ HULPFUNCTIE ============
-- "Is de ingelogde gebruiker lid van deze groep?"
-- security definer: de functie draait met extra rechten, zodat ze group_members kan lezen
-- zonder dat de RLS van group_members zichzelf in een eindeloze lus aanroept.
create function public.is_member(gid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.group_members
    where group_id = gid and profile_id = auth.uid()
  );
$$;

-- ============ ROW LEVEL SECURITY ============
alter table public.profiles      enable row level security;
alter table public.groups        enable row level security;
alter table public.group_members enable row level security;
alter table public.events        enable row level security;
alter table public.tickets       enable row level security;

-- Profielen: je ziet jezelf en mensen met wie je een groep deelt
create policy "zie groepsgenoten" on public.profiles for select to authenticated
using (
  id = auth.uid() or exists (
    select 1 from public.group_members a
    join public.group_members b on a.group_id = b.group_id
    where a.profile_id = auth.uid() and b.profile_id = profiles.id
  )
);
create policy "bewerk eigen profiel" on public.profiles for update to authenticated
using (id = auth.uid());

-- Groepen
create policy "zie eigen groepen" on public.groups for select to authenticated
using (public.is_member(id) or created_by = auth.uid());
create policy "maak groep" on public.groups for insert to authenticated
with check (created_by = auth.uid());

-- Leden
create policy "zie medeleden" on public.group_members for select to authenticated
using (public.is_member(group_id));

-- Events: alles mag, zolang het je eigen groep is
create policy "events van eigen groep" on public.events for all to authenticated
using (public.is_member(group_id)) with check (public.is_member(group_id));

-- Tickets: via het event naar de groep
create policy "tickets van eigen groep" on public.tickets for all to authenticated
using (public.is_member((select group_id from public.events where id = event_id)))
with check (public.is_member((select group_id from public.events where id = event_id)));

-- ============ AUTOMATISMEN (triggers) ============

-- 1. Bij een nieuwe login wordt automatisch een profiel aangemaakt
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- 2. Wie een groep aanmaakt, wordt er automatisch admin van
create function public.handle_new_group() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.group_members (group_id, profile_id, role) values (new.id, new.created_by, 'admin');
  return new;
end; $$;
create trigger on_group_created after insert on public.groups
for each row execute function public.handle_new_group();

-- 3. Een groep joinen met een invite-code (gecontroleerde uitzondering op RLS)
create function public.join_group(code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare gid uuid;
begin
  select id into gid from public.groups where invite_code = code;
  if gid is null then raise exception 'Ongeldige invite-code'; end if;
  insert into public.group_members (group_id, profile_id) values (gid, auth.uid())
  on conflict do nothing;
  return gid;
end; $$;

-- ============ SCHULDEN (view) ============
-- security_invoker: de view respecteert de RLS van wie hem opvraagt
create view public.open_debts with (security_invoker = true) as
select e.group_id,
       t.holder_id  as debtor_id,    -- moet betalen
       t.buyer_id   as creditor_id,  -- krijgt geld
       sum(t.price_cents) as amount_cents,
       count(*)           as ticket_count
from public.tickets t
join public.events e on e.id = t.event_id
where not t.reimbursed and t.holder_id <> t.buyer_id
group by e.group_id, t.holder_id, t.buyer_id;
