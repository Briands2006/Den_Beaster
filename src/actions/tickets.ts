"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// success: true → het formulier mag leeg (React doet dat zelf na het versturen).
// Bij een fout sturen we de ingevulde waarden terug, zoals bij de events.
export type TicketFormState = {
  error?: string;
  success?: boolean;
  values?: Record<string, string>;
} | null;

// Een bedrag zoals een Belg het typt: "45", "45,5", "45,50" of "45.50".
// Waarom geen z.coerce.number()? Number("45,50") is NaN: JavaScript kent geen komma als
// decimaalteken. En we willen hoogstens 2 cijfers na de komma (centen).
const PRICE_REGEX = /^\d{1,5}([.,]\d{1,2})?$/;

// "45,5" → 4550. We rekenen met tekst in plaats van met parseFloat(...) * 100,
// want 1.15 * 100 = 114.99999999999999 bij kommagetallen. Zo is het altijd exact.
function toCents(price: string) {
  const [euros, decimals = ""] = price.replace(",", ".").split(".");
  return Number(euros) * 100 + Number(decimals.padEnd(2, "0"));
}

const TicketSchema = z.object({
  eventId: z.uuid({ error: "Ongeldig event" }),
  holderId: z.uuid({ error: "Kies voor wie het ticket is" }),
  price: z
    .string({ error: "Vul een prijs in" })
    .trim()
    .regex(PRICE_REGEX, "Vul een geldig bedrag in, bv. 45,50")
    .transform(toCents)
    .refine((cents) => cents <= 10_000_00, "Maximaal € 10.000"),
  ticketType: z
    .string()
    .trim()
    .max(40, "Maximaal 40 tekens")
    .optional()
    .transform((v) => v || null),
});

export async function addTicket(_prev: TicketFormState, formData: FormData): Promise<TicketFormState> {
  const raw = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string")
  ) as Record<string, string>;
  const parsed = TicketSchema.safeParse(raw);
  if (!parsed.success) return { error: parsed.error.issues[0].message, values: raw };
  const { eventId, holderId, price, ticketType } = parsed.data;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Niet ingelogd" };

  // Het gat in RLS: de policy kijkt alleen of JIJ lid bent van de groep van het event.
  // Ze kijkt niet of de HOLDER lid is. Zonder deze controle kon je (met een nagemaakt
  // formulier) een ticket op naam van een vreemde zetten, en die zou dan bij jou in het
  // krijt staan. Dus: zoek de groep van het event, en kijk of de holder daarin zit.
  const { data: event } = await supabase.from("events").select("group_id").eq("id", eventId).maybeSingle();
  if (!event) return { error: "Event niet gevonden" };

  const { data: member } = await supabase
    .from("group_members")
    .select("profile_id")
    .eq("group_id", event.group_id)
    .eq("profile_id", holderId)
    .maybeSingle();
  if (!member) return { error: "Die persoon zit niet in je groep", values: raw };

  // buyer_id = jij: wie het ticket invoert, heeft het betaald.
  const { error } = await supabase.from("tickets").insert({
    event_id: eventId,
    buyer_id: user.id,
    holder_id: holderId,
    price_cents: price,
    ticket_type: ticketType,
  });
  if (error) return { error: error.message, values: raw };

  revalidatePath(`/gigs/${eventId}`);
  revalidatePath("/debts"); // een nieuw ticket kan een nieuwe schuld zijn
  return { success: true };
}

export async function deleteTicket(ticketId: string): Promise<TicketFormState> {
  const id = z.uuid().safeParse(ticketId);
  if (!id.success) return { error: "Ongeldig ticket" };

  const supabase = await createClient();
  // .select("event_id"): we krijgen de verwijderde rij terug. Daarmee weten we (1) of er
  // echt iets verwijderd is (RLS geeft geen fout, maar 0 rijen) en (2) welke pagina we
  // moeten verversen.
  const { data, error } = await supabase
    .from("tickets")
    .delete()
    .eq("id", id.data)
    .select("event_id")
    .maybeSingle();
  if (error) return { error: error.message };
  if (!data) return { error: "Ticket niet gevonden" };

  revalidatePath(`/gigs/${data.event_id}`);
  revalidatePath("/debts");
  return { success: true };
}
