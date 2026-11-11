import { notFound } from "next/navigation";
import { updateEvent } from "@/actions/events";
import { EventForm } from "@/components/event-form";
import { Card, CardContent } from "@/components/ui/card";
import { getEvent } from "@/lib/events";

// /gigs/<id>/edit: hetzelfde formulier als bij een nieuwe gig, maar al ingevuld.
export default async function EditGigPage({ params }: PageProps<"/gigs/[id]/edit">) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  return (
    <>
      <h1 className="font-heading text-5xl text-primary">Gig wijzigen</h1>
      <Card>
        <CardContent>
          <EventForm
            // bind legt het id vast op de server. Het staat niet als verborgen veld in de HTML,
            // maar Next stuurt het wel mee: daarom controleert updateEvent het opnieuw met zod.
            action={updateEvent.bind(null, event.id)}
            // Van database (snake_case, null) naar formulier (camelCase, undefined = leeg veld)
            defaults={{
              artist: event.artist,
              eventDate: event.event_date,
              venue: event.venue ?? undefined,
              city: event.city ?? undefined,
              notes: event.notes ?? undefined,
            }}
            submitLabel="Opslaan"
            cancelHref={`/gigs/${event.id}`}
          />
        </CardContent>
      </Card>
    </>
  );
}
