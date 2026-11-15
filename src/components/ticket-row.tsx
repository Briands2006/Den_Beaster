import { DeleteTicketButton } from "@/components/delete-ticket-button";
import { euro } from "@/lib/format";
import type { TicketWithPeople } from "@/lib/tickets";

// Eén regel in de ticketlijst. Geen "use client": dit is gewoon HTML van de server.
// Alleen de verwijderknop daarin is een client component (die heeft een dialoog nodig).
export function TicketRow({ ticket }: { ticket: TicketWithPeople }) {
  const { buyer, holder } = ticket;
  // Kocht iemand het voor een ander? Dan tonen we wie betaalde: dat wordt later een schuld.
  const boughtForSomeoneElse = buyer.id !== holder.id;

  return (
    <li className="flex items-center gap-3 py-3">
      {/* min-w-0 + truncate: een heel lange naam duwt de prijs niet van het scherm */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-lg">{holder.display_name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {[ticket.ticket_type, boughtForSomeoneElse && `betaald door ${buyer.display_name}`]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </div>
      {/* tabular-nums: alle cijfers even breed, zodat de prijzen netjes onder elkaar staan */}
      <span className="text-lg tabular-nums">{euro(ticket.price_cents)}</span>
      <DeleteTicketButton ticketId={ticket.id} label={holder.display_name} />
    </li>
  );
}
