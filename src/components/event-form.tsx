"use client";
import { useActionState } from "react";
import Link from "next/link";
import type { EventFormState } from "@/actions/events";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Dezelfde velden als in EventSchema (actions/events.ts). De namen (name="...") moeten
// exact overeenkomen, want de action leest het formulier op die namen.
type EventValues = {
  artist?: string;
  venue?: string;
  city?: string;
  eventDate?: string;
  notes?: string;
};

type Props = {
  // De Server Action die het formulier uitvoert: createEvent, of updateEvent.bind(null, id).
  // Een Server Action mag je als prop doorgeven aan een Client Component: Next maakt er
  // achter de schermen een verwijzing van, de code zelf blijft op de server.
  action: (prev: EventFormState, formData: FormData) => Promise<EventFormState>;
  defaults?: EventValues; // ingevuld bij wijzigen, leeg bij nieuw
  submitLabel: string;
  cancelHref: string;
};

export function EventForm({ action, defaults = {}, submitLabel, cancelHref }: Props) {
  const [state, formAction, pending] = useActionState<EventFormState, FormData>(action, null);

  // Na een fout: toon wat de gebruiker net typte. Anders: de beginwaarden.
  // React maakt het formulier na het versturen leeg en zet het terug op deze defaultValues.
  const values: EventValues = state?.values ?? defaults;

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="artist">Artiest *</Label>
        <Input
          id="artist"
          name="artist"
          required
          maxLength={100}
          defaultValue={values.artist}
          placeholder="Gojira"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="eventDate">Datum *</Label>
        {/* type="date": de gsm toont een kalender, en de waarde is altijd YYYY-MM-DD */}
        <Input id="eventDate" name="eventDate" type="date" defaultValue={values.eventDate} />
      </div>

      {/* Op een breder scherm naast elkaar, op de gsm onder elkaar */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="venue">Zaal</Label>
          <Input id="venue" name="venue" maxLength={100} defaultValue={values.venue} placeholder="Lotto Arena" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">Stad</Label>
          <Input id="city" name="city" maxLength={60} defaultValue={values.city} placeholder="Antwerpen" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notities</Label>
        <Textarea
          id="notes"
          name="notes"
          maxLength={500}
          defaultValue={values.notes}
          placeholder="Deuren om 19u, verzamelen aan het station"
        />
      </div>

      {/* role="alert": een schermlezer leest de fout meteen voor */}
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Bezig…" : submitLabel}
        </Button>
        {/* Een link die eruitziet als een knop: buttonVariants geeft dezelfde classes */}
        <Link href={cancelHref} className={buttonVariants({ variant: "outline" })}>
          Annuleren
        </Link>
      </div>
    </form>
  );
}
