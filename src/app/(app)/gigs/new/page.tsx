import { createEvent } from "@/actions/events";
import { EventForm } from "@/components/event-form";
import { Card, CardContent } from "@/components/ui/card";

// /gigs/new: een nieuwe gig toevoegen.
// Later komt er ook /gigs/[id]. Next kiest altijd eerst de vaste naam "new",
// dus /gigs/new wordt nooit gelezen als een gig met id "new".
export default function NewGigPage() {
  return (
    <>
      <h1 className="font-heading text-5xl text-primary">Nieuwe gig</h1>
      <Card>
        <CardContent>
          <EventForm action={createEvent} submitLabel="Gig toevoegen" cancelHref="/" />
        </CardContent>
      </Card>
    </>
  );
}
