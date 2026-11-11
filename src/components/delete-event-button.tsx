"use client";
import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { deleteEvent, type EventFormState } from "@/actions/events";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Verwijderen kun je niet ongedaan maken, en de tickets (en schulden) van de gig
// verdwijnen mee. Daarom eerst een bevestigingsvenster.
export function DeleteEventButton({ eventId, artist }: { eventId: string; artist: string }) {
  // .bind(null, eventId): een nieuwe functie waarin het id al vastligt.
  // useActionState roept ze aan met (vorige status, formData); die negeert deleteEvent gewoon.
  const [state, formAction, pending] = useActionState<EventFormState, FormData>(
    deleteEvent.bind(null, eventId),
    null
  );

  return (
    <Dialog>
      {/* render: Base UI tekent onze eigen Button, met het gedrag van een dialoogknop */}
      <DialogTrigger render={<Button variant="destructive" />}>
        <Trash2 /> Verwijderen
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">{artist} verwijderen?</DialogTitle>
          <DialogDescription>
            De gig en alle tickets ervan worden verwijderd, ook openstaande schulden.
            Dit kun je niet ongedaan maken.
          </DialogDescription>
        </DialogHeader>
        {state?.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Annuleren</DialogClose>
          {/* Een formulier met alleen een knop: zo werkt het ook als JavaScript nog laadt */}
          <form action={formAction}>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Bezig…" : "Ja, verwijderen"}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
