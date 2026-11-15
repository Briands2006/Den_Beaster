"use client";
import { useActionState } from "react";
import { Check, Undo2 } from "lucide-react";
import { setReimbursed, type TicketFormState } from "@/actions/tickets";
import { Button } from "@/components/ui/button";

type Props = { ticketId: string; reimbursed: boolean; name: string };

// Eén ticket afvinken als terugbetaald, of dat terugdraaien.
// Geen bevestigingsvenster zoals bij verwijderen: je kunt het altijd terugdraaien,
// dus een extra klik zou alleen hinderen.
export function ReimburseButton({ ticketId, reimbursed, name }: Props) {
  // !reimbursed: de knop zet de status altijd naar het omgekeerde van wat hij nu is
  const [state, formAction, pending] = useActionState<TicketFormState, FormData>(
    setReimbursed.bind(null, ticketId, !reimbursed),
    null
  );

  return (
    <form action={formAction} className="inline">
      <Button
        type="submit"
        variant={reimbursed ? "ghost" : "outline"}
        size="sm"
        disabled={pending}
        // Voor een schermlezer zeggen we voluit over wiens ticket het gaat
        aria-label={reimbursed ? `Terugbetaling van ${name} ongedaan maken` : `${name} heeft terugbetaald`}
      >
        {reimbursed ? <Undo2 /> : <Check />}
        {pending ? "Bezig…" : reimbursed ? "Ongedaan maken" : "Terugbetaald"}
      </Button>
      {state?.error && (
        <span role="alert" className="ml-2 text-sm text-destructive">
          {state.error}
        </span>
      )}
    </form>
  );
}
