import Link from "next/link";
import { MapPin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { countdown, daysUntil, gigDate } from "@/lib/format";
import type { Tables } from "@/lib/database.types";

// Tables<"events"> = het type van één rij uit de tabel events, gegenereerd uit de database.
// Pick: we vragen alleen de kolommen die de kaart echt nodig heeft.
type Gig = Pick<Tables<"events">, "id" | "artist" | "venue" | "city" | "event_date">;

// Geen "use client": deze component heeft geen interactie (alleen een link),
// dus hij blijft een Server Component en stuurt geen JavaScript naar de browser.
export function GigCard({ gig, today }: { gig: Gig; today: string }) {
  const label = countdown(daysUntil(gig.event_date, today));
  const place = [gig.venue, gig.city].filter(Boolean).join(", ");

  return (
    // De hele kaart is klikbaar: groter doel op een gsm.
    <Link href={`/gigs/${gig.id}`} className="block rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
      <Card className="transition-colors hover:bg-muted">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-2xl">{gig.artist}</CardTitle>
            {label && <Badge>{label}</Badge>}
          </div>
          <CardDescription className="space-y-1">
            <span className="block text-foreground">{gigDate(gig.event_date)}</span>
            {place && (
              <span className="flex items-center gap-1">
                <MapPin className="size-4" aria-hidden /> {place}
              </span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}
