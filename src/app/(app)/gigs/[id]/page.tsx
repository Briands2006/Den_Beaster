import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, Pencil } from "lucide-react";
import { DeleteEventButton } from "@/components/delete-event-button";
import { TicketForm } from "@/components/ticket-form";
import { TicketRow } from "@/components/ticket-row";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { euro, gigDate } from "@/lib/format";
import { getEvent } from "@/lib/events";
import { getGroupMembers } from "@/lib/groups";
import { createClient } from "@/lib/supabase/server";
import { getTickets } from "@/lib/tickets";

// /gigs/<id>: detail van één gig: wijzigen, verwijderen, tickets bekijken en toevoegen.
// In Next 16 is params een Promise: je moet hem eerst awaiten.
export default async function GigPage({ params }: PageProps<"/gigs/[id]">) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();

  // Drie dingen die niet van elkaar afhangen → tegelijk ophalen met Promise.all,
  // in plaats van na elkaar te wachten.
  const supabase = await createClient();
  const [tickets, members, { data: { user } }] = await Promise.all([
    getTickets(event.id),
    getGroupMembers(event.group_id),
    supabase.auth.getUser(),
  ]);
  if (!user) notFound(); // kan eigenlijk niet: de proxy laat je zonder login niet binnen

  // reduce: tel alle prijzen op, beginnend bij 0. Alles in centen, dus geen afrondingsfouten.
  const total = tickets.reduce((sum, t) => sum + t.price_cents, 0);

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
          <CardTitle className="text-2xl">Tickets ({tickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {tickets.length === 0 ? (
            <p className="text-muted-foreground">Nog geen tickets. Voeg er hieronder een toe.</p>
          ) : (
            <>
              <ul className="divide-y">
                {tickets.map((t) => (
                  <TicketRow key={t.id} ticket={t} currentUserId={user.id} />
                ))}
              </ul>
              {/* pr-11: zelfde inspringing als de prijzen erboven (ruimte van de verwijderknop) */}
              <p className="flex justify-between border-t-2 pt-3 pr-11 text-lg font-semibold">
                <span>Totaal</span>
                <span className="tabular-nums">{euro(total)}</span>
              </p>
            </>
          )}
        </CardContent>
      </Card>

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
