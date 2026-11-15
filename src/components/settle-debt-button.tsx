"use client";
import { useActionState } from "react";
import { Check } from "lucide-react";
import { settleDebt, type TicketFormState } from "@/actions/tickets";
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

type Props = {
  debtorId: string;
  name: string;
  amount: string; // al opgemaakt, bv. "€ 90,00": geld formatteren doen we op de server
};

// "Jan heeft me alles terugbetaald". Eerst bevestigen: zo vink je niet per ongeluk
// met één duim een schuld van € 200 weg.
export function SettleDebtButton({ debtorId, name, amount }: Props) {
  const [state, formAction, pending] = useActionState<TicketFormState, FormData>(
    settleDebt.bind(null, debtorId),
    null
  );

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Check /> Terugbetaald
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl">Heeft {name} je {amount} terugbetaald?</DialogTitle>
          <DialogDescription>
            Alle openstaande tickets die je voor {name} kocht, worden afgevinkt.
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
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Bezig…" : "Ja, alles terugbetaald"}
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
