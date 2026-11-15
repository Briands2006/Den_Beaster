import { DeleteTicketButton } from "@/components/delete-ticket-button";
import { ReimburseButton } from "@/components/reimburse-button";
import { Badge } from "@/components/ui/badge";
import { euro, shortDate } from "@/lib/format";
import type { TicketWithPeople } from "@/lib/tickets";

type Props = {
  ticket: TicketWithPeople;
  currentUserId: string; // om te weten of jij de koper bent (alleen die mag afvinken)
};

// Eén regel in de ticketlijst. Geen "use client": dit is gewoon HTML van de server.
// Alleen de knoppen daarin zijn client components.
export function TicketRow({ ticket, currentUserId }: Props) {
  const { buyer, holder } = ticket;
  // Kocht iemand het voor een ander? Alleen dan is er een schuld, en dus iets terug te betalen.
  const isDebt = buyer.id !== holder.id;
  const iAmBuyer = buyer.id === currentUserId;

  return (
    <li className="space-y-2 py-3">
      <div className="flex items-center gap-3">
        {/* min-w-0 + truncate: een heel lange naam duwt de prijs niet van het scherm */}
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg">{holder.display_name}</p>
          <p className="truncate text-sm text-muted-foreground">
            {[ticket.ticket_type, isDebt && `betaald door ${buyer.display_name}`]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        {/* tabular-nums: alle cijfers even breed, zodat de prijzen netjes onder elkaar staan */}
        <span className="text-lg tabular-nums">{euro(ticket.price_cents)}</span>
        <DeleteTicketButton ticketId={ticket.id} label={holder.display_name} />
      </div>

      {/* Status van de terugbetaling: alleen zinvol als er een schuld is */}
      {isDebt && (
        <div className="flex flex-wrap items-center gap-2">
          {ticket.reimbursed ? (
            <Badge variant="secondary">
              Terugbetaald{ticket.reimbursed_at && ` op ${shortDate(ticket.reimbursed_at)}`}
            </Badge>
          ) : (
            <Badge variant="outline">Nog niet terugbetaald</Badge>
          )}
          {iAmBuyer && (
            <ReimburseButton ticketId={ticket.id} reimbursed={ticket.reimbursed} name={holder.display_name} />
          )}
        </div>
      )}
    </li>
  );
}
