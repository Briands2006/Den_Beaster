import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Pencil } from "lucide-react";
import { DeleteEventButton } from "@/components/delete-event-button";
import { buttonVariants } from "@/components/ui/button";
import { gigDate } from "@/lib/format";
import { getEvent } from "@/lib/events";

// /gigs/<id>: detail van één gig, met wijzigen en verwijderen. Tickets komen in feature 3.
// In Next 16 is params een Promise: je moet hem eerst awaiten.
export default async function GigPage({ params }: PageProps<"/gigs/[id]">) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  const place = [event.venue, event.city].filter(Boolean).join(", ");

  return (
    <>
      <Link href="/" className={buttonVariants({ variant: "ghost", className: "-ml-2.5" })}>
        <ArrowLeft /> Alle gigs
      </Link>

      <div className="space-y-1">
        <h1 className="font-heading text-5xl text-primary">{event.artist}</h1>
        <p className="text-lg">{gigDate(event.event_date)}</p>
        {place && (
          <p className="flex items-center gap-1 text-muted-foreground">
            <MapPin className="size-4" aria-hidden /> {place}
          </p>
        )}
      </div>

      {/* whitespace-pre-line: enters in de notities blijven zichtbaar */}
      {event.notes && <p className="whitespace-pre-line">{event.notes}</p>}

      <div className="flex gap-2">
        <Link href={`/gigs/${event.id}/edit`} className={buttonVariants({ variant: "outline" })}>
          <Pencil /> Wijzigen
        </Link>
        <DeleteEventButton eventId={event.id} artist={event.artist} />
      </div>
    </>
  );
}
