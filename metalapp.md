# 🤘 Pit Ledger: de metal-ticketapp, stap voor stap

Dit is een webapp waarmee een vriendengroep bijhoudt wie welke tickets kocht, voor welke optredens, wanneer die plaatsvinden, wat ze kostten en wie wie nog moet terugbetalen.

**Stack:** Next.js (App Router, TypeScript) · Tailwind CSS + shadcn/ui · Supabase (Postgres, Auth, Row Level Security) · Vercel

Je werkt de stappen een voor een af. Na elke stap heb je iets dat werkt.

---

## Het principe achter de volgorde: eerst een "walking skeleton"

Beginners bouwen vaak eerst alle features en zetten de app pas op het einde online. Dan lopen deployment, login en database allemaal tegelijk mis, en weet je niet waar het probleem zit.

Wij doen het andersom:

1. **Eerst de pijplijn**: een lege app die al online staat.
2. **Dan de fundering**: database, beveiliging en login.
3. **Dan de features**, één per keer, en elke feature gaat meteen online.

Zo heb je altijd een werkende versie en weet je bij een fout dat ze in het laatste stukje zit.

---

## Stap 0: Gereedschap installeren

**Waarom:** je hebt een paar programma's nodig om code te draaien en om met GitHub en Supabase te praten.

```bash
node -v          # moet v20 of hoger zijn. Anders: brew install node
git --version
brew install gh                    # GitHub CLI
brew install supabase/tap/supabase # Supabase CLI
gh auth login                      # eenmalig inloggen bij GitHub
```

Maak ook (gratis) accounts aan op **github.com**, **supabase.com** en **vercel.com**. Log op Vercel in **met je GitHub-account**, dan kunnen ze elkaar later vinden.

Als editor raad ik **VS Code** aan, met de extensies *Tailwind CSS IntelliSense* en *ESLint*.

---

## Stap 1: Het Next.js-project aanmaken

```bash
cd ~/Code
npx create-next-app@latest pit-ledger --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd pit-ledger
npm run dev
```

Open http://localhost:3000. Zie je de Next.js-startpagina, dan werkt het.

**Waarom deze vlaggen?**
- `--typescript`: types vangen fouten vroeg op, zeker bij bedragen.
- `--tailwind`: de styling is meteen ingesteld.
- `--app`: de moderne **App Router**, met Server Components en Server Actions.
- `--src-dir`: je code komt in `src/`, los van configbestanden. Dat houdt de root overzichtelijk.
- `--import-alias "@/*"`: je schrijft `import x from "@/lib/x"` in plaats van `../../../lib/x`.

---

## Stap 2: Naar GitHub pushen

```bash
git add -A && git commit -m "Initial Next.js setup"
gh repo create pit-ledger --private --source=. --push
```

**Waarom nu al?** GitHub is je **back-up** en je **geschiedenis**: elke commit is een punt waarnaar je kunt terugkeren. Vercel deployt bovendien vanuit GitHub, dus de repo moet er zijn voor stap 3. Bij Vercel mag de repo gewoon **privé** blijven, in tegenstelling tot GitHub Pages.

---

## Stap 3: Vercel koppelen

1. Ga naar vercel.com → **Add New… → Project**.
2. Kies de repo `pit-ledger` en klik op **Deploy**. Vercel herkent Next.js zelf.
3. Na ongeveer een minuut krijg je een URL zoals `pit-ledger-xxx.vercel.app`.

**Waarom nu, met een lege app?** Dit is je **CI/CD-pijplijn** (continuous deployment):

```
git push ──▶ GitHub ──▶ Vercel bouwt ──▶ online
```

Vanaf nu staat elke push op `main` automatisch in productie. Elke andere branch krijgt een eigen **preview-URL**, handig om iets te testen voor het live gaat. Lukt de build op Vercel niet, dan zie je dat meteen bij een kleine wijziging, en niet pas na drie weken bouwen.

---

## Stap 4: Het Supabase-project aanmaken

1. Ga naar supabase.com → **New project**.
2. Naam: `pit-ledger`. Kies een sterk databasewachtwoord en bewaar het in je wachtwoordmanager.
3. **Regio: Central EU (Frankfurt)**.
4. Ga naar **Project Settings → API** (of **API Keys**) en noteer:
   - de **Project URL**;
   - de **publishable key** (`sb_publishable_…`). Bij oudere projecten heet die de **anon key**.

Maak in je projectmap een bestand `.env.local` aan:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxx
```

**Waarom?**
- **Frankfurt**: je vrienden zitten in Europa. Dat geeft een snellere verbinding, en de persoonsgegevens (namen, e-mails) blijven in de EU, wat netjes is voor de GDPR.
- **`.env.local`**: dit bestand staat standaard in `.gitignore` en komt dus nooit op GitHub. Configuratie hoort niet in je code, zodat dezelfde code lokaal en in productie met andere waarden kan draaien.
- **`NEXT_PUBLIC_`-prefix**: Next.js geeft alleen variabelen met deze prefix door aan de browser. De publishable key mag publiek zijn, want RLS beschermt de data. De **`service_role`/secret key** gebruiken we **nooit** in de app. Die omzeilt alle beveiliging.

---

## Stap 5: Het databaseschema als code (migraties)

```bash
supabase init                                  # maakt een map supabase/
supabase login
supabase link --project-ref <jouw-project-ref> # de ref staat in je Supabase-URL
supabase migration new init_schema             # maakt supabase/migrations/<datum>_init_schema.sql
```

**Waarom migraties, en niet tabellen aanklikken in het Supabase-dashboard?**
Klikken laat geen spoor na. Een **migratie** is een SQL-bestand in Git. Daardoor zie je wie wat wanneer veranderde, kun je de database exact opnieuw opbouwen, en blijven je code en je database samen geversioneerd. Dit heet **"infrastructure as code"**.

Zet het volgende in dat migratiebestand. Lees de commentaarregels: daar staat het waarom.

```sql
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
```

Daarna:

```bash
supabase db push   # voert de migratie uit op je cloud-database
```

**Drie dingen om te onthouden uit dit schema:**
1. **Constraints** (`not null`, `check (price_cents >= 0)`, `references`) zijn de laatste verdedigingslinie. Zelfs met een bug in je code kan er geen negatieve prijs of ticket zonder optreden in de database komen.
2. **`join_group` als functie**: je mag een groep pas zien als je er lid van bent. Je kunt dus niet zelf naar de groep zoeken om te joinen. De functie is een **gecontroleerde deur**: ze doet precies één ding met verhoogde rechten, en niets meer.
3. **De view `open_debts`** berekent schulden live uit de tickets. We **bewaren feiten en berekenen afgeleiden**, zodat schulden nooit uit sync kunnen raken.

---

## Stap 6: TypeScript-types genereren

```bash
supabase gen types typescript --linked > src/lib/database.types.ts
```

**Waarom:** Supabase leest je schema en schrijft er TypeScript-types voor. Typ je straks `supabase.from('tickets').insert({ prijs: 10 })`, dan kleurt je editor dat meteen rood, want het veld heet `price_cents`. **Draai dit commando opnieuw na elke migratie.**

---

## Stap 7: De Supabase-clients in Next.js

```bash
npm install @supabase/supabase-js @supabase/ssr zod
```

**Waarom twee clients?** Je code draait op twee plaatsen: **in de browser** (interactieve knoppen) en **op de server** (Server Components en Server Actions). Allebei moeten weten wie er ingelogd is. Die informatie zit in een **cookie**, en de manier om cookies te lezen verschilt per plaats.

`src/lib/supabase/client.ts` (browser):

```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

`src/lib/supabase/server.ts` (server):

```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/database.types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // In Server Components mag je geen cookies zetten; de proxy hieronder doet dat.
          }
        },
      },
    }
  );
}
```

`src/proxy.ts` (in Next.js 15 heet dit bestand `middleware.ts` en de functie `middleware`):

```ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isPublic = path.startsWith("/login") || path.startsWith("/auth");

  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|webp)$).*)"],
};
```

**Waarom een proxy (middleware)?** Die draait **vóór elke pagina**. Hij doet twee dingen:
1. Hij **ververst de login-sessie**. Tokens verlopen na een uur, en de proxy vernieuwt ze ongemerkt.
2. Hij **houdt de deur dicht**: wie niet ingelogd is, gaat naar `/login`.

Let op: dit is **gebruiksgemak, geen beveiliging**. De echte bescherming blijft RLS. Ook als iemand de proxy zou omzeilen, geeft de database niets terug.

---

## Stap 8: Login met een magic link

### 8a. Supabase instellen

In het Supabase-dashboard, onder **Authentication → URL Configuration**:
- **Site URL**: je Vercel-URL, bv. `https://pit-ledger.vercel.app`
- **Redirect URLs**: voeg toe:
  - `http://localhost:3000/**`
  - `https://pit-ledger.vercel.app/**`
  - `https://pit-ledger-*-<jouw-vercel-team>.vercel.app/**` (voor preview-deploys)

**Waarom?** Supabase stuurt na het inloggen alleen door naar adressen op deze lijst. Zonder lijst kan een aanvaller een loginlink maken die naar zijn eigen site doorstuurt. Dat heet een **open redirect**.

Onder **Authentication → Emails → Magic Link**: pas de link in de template aan naar:

```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=email">Enter the pit 🤘</a>
```

**Waarom de template aanpassen?** Standaard gebruikt de magic link een **PKCE-code** die alleen werkt in **dezelfde browser** waarin je de link aanvroeg. Vraag je de link aan in Safari en open je de mail in de Gmail-app, dan opent die in een andere browser en mislukt de login. Op een gsm gebeurt dat voortdurend. Met de **token_hash** werkt de link in elke browser.

### 8b. Loginpagina en Server Action

`src/app/login/actions.ts`:

```ts
"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export async function sendMagicLink(_prev: unknown, formData: FormData) {
  const parsed = z.string().email().safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Dat is geen geldig e-mailadres" };

  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });
  return error ? { error: error.message } : { success: "Check je mailbox 🤘" };
}
```

`src/app/auth/confirm/route.ts`:

```ts
import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) redirect("/");
  }
  redirect("/login?error=link");
}
```

**De flow, stap voor stap:**

```
1. Je typt je e-mail       ──▶ Server Action ──▶ Supabase verstuurt de mail
2. Je klikt op de link     ──▶ /auth/confirm?token_hash=…
3. verifyOtp controleert   ──▶ Supabase zet een sessie-cookie
4. redirect naar /         ──▶ de proxy ziet de cookie ──▶ je bent binnen
```

**Waarom `origin` uit de headers halen?** Zo werkt dezelfde code op localhost, in preview en in productie zonder iets aan te passen.

⚠️ **Valkuil:** de ingebouwde mailserver van Supabase verstuurt maar een paar mails per uur en is alleen bedoeld om te testen. Voor je vrienden ga gebruiken, koppel je een eigen SMTP-dienst, bv. **Resend** (gratis tier), onder **Authentication → SMTP Settings**.

---

## Stap 9: Het metal-thema

```bash
npx shadcn@latest init
npx shadcn@latest add button card input label dialog form select badge
```

In `src/app/layout.tsx` laad je de fonts via `next/font`:

```ts
import { Metal_Mania, Barlow_Condensed } from "next/font/google";
const metal = Metal_Mania({ weight: "400", subsets: ["latin"], variable: "--font-metal" });
const body  = Barlow_Condensed({ weight: ["400", "600"], subsets: ["latin"], variable: "--font-body" });
```

In `src/app/globals.css` overschrijf je de shadcn-kleurtokens:

```css
:root {
  --background: oklch(0.12 0 0);        /* bijna zwart */
  --foreground: oklch(0.92 0.01 250);   /* staalwit */
  --primary: oklch(0.55 0.22 27);       /* bloedrood */
  --primary-foreground: oklch(0.98 0 0);
  --muted: oklch(0.22 0.01 250);        /* donker staal */
  --border: oklch(0.3 0.01 250);
  --radius: 0.25rem;                    /* scherpe hoeken, minder "zacht" */
}
```

**Waarom zo?**
- **`next/font`** downloadt de fonts tijdens de build en serveert ze zelf. Er gaat geen aanvraag naar Google, en de tekst verspringt niet tijdens het laden.
- **Metal Mania alleen voor titels**: decoratieve fonts zijn moeilijk leesbaar in kleine tekst. Bedragen en datums moeten in één oogopslag te lezen zijn.
- **Tokens in plaats van vaste kleuren**: elke shadcn-component gebruikt `--primary`, dus met één regel verander je de kleur in de hele app.

---

## Stap 10: De mappenstructuur en de features

```
src/
├─ app/
│  ├─ login/                 ← publiek
│  ├─ auth/confirm/route.ts  ← publiek
│  ├─ (app)/                 ← alles hierin: ingelogd, met bottom-nav
│  │  ├─ layout.tsx          ← navigatiebalk onderaan
│  │  ├─ page.tsx            ← 🔥 Upcoming Gigs
│  │  ├─ gigs/[id]/page.tsx  ← detail + tickets
│  │  ├─ debts/page.tsx      ← 🩸 Blood Debts
│  │  ├─ archive/page.tsx    ← 💀 Hall of Fame
│  │  └─ group/page.tsx      ← leden + invite-link
│  └─ manifest.ts            ← PWA
├─ actions/                  ← Server Actions per domein
│  ├─ events.ts  tickets.ts  groups.ts
├─ components/
│  ├─ ui/                    ← shadcn (generiek)
│  └─ gig-card.tsx, ticket-row.tsx, debt-list.tsx  ← eigen componenten
└─ lib/
   ├─ supabase/ (client.ts, server.ts)
   ├─ database.types.ts
   └─ format.ts              ← euro's en datums in nl-BE
```

**Waarom zo opgedeeld?**
- **`(app)` met haakjes** is een *route group*: de map telt niet mee in de URL, maar deelt wel één layout. Zo krijgen alle ingelogde schermen dezelfde navigatie, en de loginpagina niet.
- **`actions/` per domein**: alles wat tickets wijzigt staat op één plek. Zoek je een bug in tickets, dan weet je waar je moet kijken.
- **`components/ui` en eigen componenten apart**: generieke bouwstenen apart van je eigen domeincomponenten.
- **`lib/format.ts`**: geld en datums formatteer je op **één** plek:

  ```ts
  export const euro = (cents: number) =>
    new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR" }).format(cents / 100);
  ```

### Hoe een feature eruitziet: een ticket toevoegen

`src/actions/tickets.ts`:

```ts
"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const TicketSchema = z.object({
  eventId: z.string().uuid(),
  holderId: z.string().uuid(),
  price: z.coerce.number().min(0).max(10000),
  ticketType: z.string().max(40).optional(),
});

export async function addTicket(_prev: unknown, formData: FormData) {
  const parsed = TicketSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Controleer je invoer" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Niet ingelogd" };

  const { eventId, holderId, price, ticketType } = parsed.data;
  const { error } = await supabase.from("tickets").insert({
    event_id: eventId,
    buyer_id: user.id,
    holder_id: holderId,
    price_cents: Math.round(price * 100),   // euro → centen
    ticket_type: ticketType,
  });
  if (error) return { error: error.message };

  revalidatePath(`/gigs/${eventId}`);
  revalidatePath("/debts");
  return { success: true };
}
```

**Wat er gebeurt en waarom:**
1. **`"use server"`**: deze code draait nooit in de browser, alleen op Vercel.
2. **zod `safeParse`**: formulierdata is altijd tekst en altijd onbetrouwbaar. Je controleert de vorm vóór je iets doet. `z.coerce.number()` zet `"45.50"` om naar `45.5`.
3. **`Math.round(price * 100)`**: euro's worden centen, om afrondingsfouten te vermijden.
4. **RLS** controleert in de database nog eens of je dit event mag aanpassen.
5. **`revalidatePath`**: Next.js cachet pagina's. Hiermee zeg je dat die twee pagina's verouderd zijn en opnieuw opgebouwd moeten worden, zodat het schuldenoverzicht meteen klopt.

Elke andere feature volgt hetzelfde patroon: **schema → action → formulier → revalidate**.

### Volgorde van de features

1. **Groep aanmaken en joinen.** Zonder groep kun je niets anders, want alles hangt eraan via RLS.
2. **Events** (CRUD) en de Upcoming Gigs-pagina.
3. **Tickets** op de detailpagina.
4. **Schulden**: de view `open_debts` tonen, met een knop "terugbetaald" die `reimbursed = true` en `reimbursed_at = now()` zet.
5. **Archief**: events met `event_date < today`.

Na elke feature: **commit, push, testen op de Vercel-URL**.

---

## Stap 11: Omgevingsvariabelen in Vercel

Ga naar Vercel → je project → **Settings → Environment Variables** en voeg toe:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Vink **Production** én **Preview** aan. Klik daarna op **Redeploy**.

**Waarom?** `.env.local` staat niet op GitHub, dus Vercel kent die waarden niet. Je moet ze daar apart ingeven. Doe dit **voor je de auth-code pusht**, anders crasht de build.

---

## Stap 12: PWA, zodat de app op je gsm komt

`src/app/manifest.ts`:

```ts
import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Pit Ledger",
    short_name: "Pit Ledger",
    start_url: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#8b0000",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
```

Op je iPhone: Safari → Deel → **Zet op beginscherm**.

**Waarom:** `display: "standalone"` verbergt de adresbalk. De app voelt dan als een echte app, zonder app store.

---

## Je werkritme vanaf nu

```
1. git checkout -b feature/tickets      ← nieuwe branch per feature
2. bouwen + testen op localhost:3000
3. (schema nodig?) supabase migration new … → db push → gen types
4. git push                             ← Vercel maakt een preview-URL
5. testen op je gsm via die preview-URL
6. mergen naar main                     ← automatisch live
```

**Waarom branches?** `main` is altijd de versie die je vrienden gebruiken. Experimenten gebeuren ernaast, en pas als iets werkt, gaat het naar productie.

---

## Samenvatting van de volgorde

| # | Stap | Resultaat |
|---|---|---|
| 0 | Gereedschap | Je Mac is klaar |
| 1–3 | Next.js → GitHub → Vercel | Lege app staat online |
| 4–6 | Supabase, migratie, types | Beveiligde database |
| 7–8 | Clients en magic link | Inloggen werkt |
| 9 | Thema | Het ziet er metal uit 🤘 |
| 10–11 | Features en env-vars | Groepen, gigs, tickets, schulden |
| 12 | PWA | Op je gsm-startscherm |

## Testen of alles klopt

- **RLS:** twee testaccounts in verschillende groepen mogen elkaars data niet zien. `join_group` met een fout code moet een foutmelding geven.
- **Magic link:** aanvragen in de ene browser en openen in een andere moet werken.
- **Schulden:** A koopt voor B en C, `open_debts` toont de juiste bedragen, en na "terugbetaald" verdwijnt de schuld.
- **Build:** `npm run build` moet slagen voor elke merge naar `main`.
