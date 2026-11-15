"use client";
import { useActionState } from "react";
import { addTicket, type TicketFormState } from "@/actions/tickets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  eventId: string;
  members: { id: string; display_name: string }[];
  currentUserId: string; // standaard koop je een ticket voor jezelf
};

export function TicketForm({ eventId, members, currentUserId }: Props) {
  const [state, formAction, pending] = useActionState<TicketFormState, FormData>(addTicket, null);

  // Zelfde truc als bij EventForm: na een fout tonen we wat er net getypt werd.
  // Na succes is state.values leeg → React zet het formulier terug op de standaardwaarden.
  const values = state?.values ?? {};

  return (
    <form action={formAction} className="space-y-4">
      {/* Verborgen veld: de action moet weten bij welke gig het ticket hoort */}
      <input type="hidden" name="eventId" value={eventId} />

      <div className="space-y-2">
        <Label htmlFor="holderId">Voor wie? *</Label>
        {/* Bewust een gewone <select> en niet de shadcn-Select: op een gsm opent dan de
            ingebouwde keuzelijst van het toestel (groot, vertrouwd, toegankelijk), en een
            native select werkt vanzelf met FormData en met het leegmaken na versturen.
            De classes nemen we over van Input, zodat hij er hetzelfde uitziet. */}
        <select
          id="holderId"
          name="holderId"
          required
          defaultValue={values.holderId ?? currentUserId}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
        >
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.id === currentUserId ? `${m.display_name} (ik)` : m.display_name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="price">Prijs (€) *</Label>
          {/* type="text" + inputMode="decimal": de gsm toont cijfers mét komma.
              type="number" zou in sommige browsers "45,50" weigeren of stil leegmaken. */}
          <Input
            id="price"
            name="price"
            inputMode="decimal"
            required
            defaultValue={values.price}
            placeholder="45,50"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ticketType">Type</Label>
          <Input
            id="ticketType"
            name="ticketType"
            maxLength={40}
            defaultValue={values.ticketType}
            placeholder="Staanplaats"
          />
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {/* aria-live: een schermlezer meldt het ook als het ticket gelukt is */}
      <p aria-live="polite" className="sr-only">
        {state?.success ? "Ticket toegevoegd" : ""}
      </p>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Bezig…" : "Ticket toevoegen"}
      </Button>
    </form>
  );
}
