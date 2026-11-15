"use client";
import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import { deleteTicket, type TicketFormState } from "@/actions/tickets";
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

// Zelfde opbouw als DeleteEventButton: eerst bevestigen, want met het ticket verdwijnt
// ook de schuld die eraan hangt.
export function DeleteTicketButton({ ticketId, label }: { ticketId: string; label: string }) {
  const [state, formAction, pending] = useActionState<TicketFormState, FormData>(
    deleteTicket.bind(null, ticketId),
    null
  );

  return (
    <Dialog>
      {/* Alleen een icoon → aria-label, anders hoort een schermlezer gewoon "knop" */}
      <DialogTrigger
        render={<Button variant="ghost" size="icon" aria-label={`Ticket van ${label} verwijderen`} />}
      >
        <Trash2 />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">Ticket verwijderen?</DialogTitle>
          <DialogDescription>
            Het ticket van {label} wordt verwijderd, ook als er nog een schuld voor openstaat.
          </DialogDescription>
        </DialogHeader>
        {state?.error && (
          <p role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Annuleren</DialogClose>
          <form action={formAction}>
            <Button type="submit" variant="destructive" disabled={pending} className="w-full">
              {pending ? "Bezig…" : "Ja, verwijderen"}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
