import { notFound } from "next/navigation";
import { gigDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

// /gigs/<id>: detail van één gig. Eenvoudige versie; wijzigen/verwijderen komt in stap 5,
// tickets in feature 3.
// In Next 16 is params een Promise: je moet hem eerst awaiten.
export default async function GigPage({ params }: PageProps<"/gigs/[id]">) {
  const { id } = await params;

  const supabase = await createClient();
  // RLS: een gig van een andere groep krijg je gewoon niet terug → null → 404.
  // Een ongeldig id (geen uuid) geeft een fout van Postgres; ook dat behandelen we als 404.
  const { data: event } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (!event) notFound();

  return (
    <>
      <div>
        <h1 className="font-heading text-5xl text-primary">{event.artist}</h1>
        <p className="text-lg">{gigDate(event.event_date)}</p>
        {(event.venue || event.city) && (
          <p className="text-muted-foreground">
            {[event.venue, event.city].filter(Boolean).join(", ")}
          </p>
        )}
      </div>
      {event.notes && <p className="whitespace-pre-line">{event.notes}</p>}
    </>
  );
}
