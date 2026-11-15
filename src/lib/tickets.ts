import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// Alle tickets van één gig, oudste eerst, met de namen van koper en houder erbij.
//
// tickets heeft TWEE foreign keys naar profiles (buyer_id en holder_id). Schrijf je gewoon
// profiles(...), dan weet Supabase niet welke je bedoelt en krijg je een fout.
// Daarom noemen we de foreign key bij naam (!tickets_buyer_id_fkey) en geven we het
// resultaat een eigen naam (buyer: ...). Die namen vind je in database.types.ts.
export const getTickets = cache(async (eventId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tickets")
    .select(
      `id, price_cents, ticket_type, reimbursed,
       buyer:profiles!tickets_buyer_id_fkey(id, display_name),
       holder:profiles!tickets_holder_id_fkey(id, display_name)`
    )
    .eq("event_id", eventId)
    .order("created_at");
  if (error) throw error;
  return data;
});

// Het type van één ticket uit die lijst, afgeleid van de functie zelf.
// Pas je de select aan, dan past dit type vanzelf mee.
export type TicketWithPeople = Awaited<ReturnType<typeof getTickets>>[number];
