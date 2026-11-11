import Link from "next/link";
import { Plus } from "lucide-react";
import { GigCard } from "@/components/gig-card";
import { buttonVariants } from "@/components/ui/button";
import { todayISO } from "@/lib/format";
import { getCurrentGroup } from "@/lib/groups";
import { createClient } from "@/lib/supabase/server";

// 🔥 Upcoming Gigs: alle gigs van vandaag en later, de eerstvolgende bovenaan.
// Async Server Component: de (app)-layout zet dit al binnen <Suspense>,
// dus we mogen hier gewoon cookies/data lezen.
export default async function UpcomingGigsPage() {
  const group = await getCurrentGroup();
  if (!group) return null; // kan niet: de layout stuurt je dan al naar /welcome

  const today = todayISO();
  const supabase = await createClient();
  // .eq("group_id", ...): RLS laat je de gigs van AL je groepen zien. Zit je later in
  // meerdere groepen, dan willen we hier alleen die van de huidige groep.
  // .gte = "greater than or equal": een gig van vandaag hoort nog bij "upcoming".
  // Datums als "YYYY-MM-DD" kun je gewoon vergelijken, ook in Postgres.
  const { data: gigs, error } = await supabase
    .from("events")
    .select("id, artist, venue, city, event_date")
    .eq("group_id", group.id)
    .gte("event_date", today)
    .order("event_date");
  if (error) throw error; // toont de foutpagina; beter dan stil een lege lijst

  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-5xl text-primary">Upcoming Gigs</h1>
          <p className="text-muted-foreground">{group.name}</p>
        </div>
        <Link href="/gigs/new" className={buttonVariants()}>
          <Plus /> Gig
        </Link>
      </div>

      {gigs.length === 0 ? (
        <p className="text-muted-foreground">
          Nog geen gigs gepland. Klik op <strong>+ Gig</strong> en zet de eerste op de kalender 🤘
        </p>
      ) : (
        <ul className="space-y-3">
          {gigs.map((gig) => (
            <li key={gig.id}>
              <GigCard gig={gig} today={today} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
