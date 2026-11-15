import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Pencil } from "lucide-react";
import { DeleteEventButton } from "@/components/delete-event-button";
import { TicketForm } from "@/components/ticket-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { gigDate } from "@/lib/format";
import { getEvent } from "@/lib/events";
import { getGroupMembers } from "@/lib/groups";
import { createClient } from "@/lib/supabase/server";

// /gigs/<id>: detail van één gig, met wijzigen, verwijderen en tickets toevoegen.
// In Next 16 is params een Promise: je moet hem eerst awaiten.
export default async function GigPage({ params }: PageProps<"/gigs/[id]">) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  // Twee dingen die niet van elkaar afhangen → tegelijk ophalen met Promise.all,
  // in plaats van na elkaar te wachten.
  const supabase = await createClient();
  const [members, { data: { user } }] = await Promise.all([
    getGroupMembers(event.group_id),
    supabase.auth.getUser(),
  ]);
  if (!user) notFound(); // kan eigenlijk niet: de proxy laat je zonder login niet binnen

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

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Ticket toevoegen</CardTitle>
        </CardHeader>
        <CardContent>
          <TicketForm eventId={event.id} members={members} currentUserId={user.id} />
        </CardContent>
      </Card>
    </>
  );
}
