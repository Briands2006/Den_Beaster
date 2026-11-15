"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentGroup } from "@/lib/groups";
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

// ============ TERUGBETALEN (feature 4) ============
//
// Wie mag afvinken dat iets terugbetaald is? Alleen de KOPER (buyer): die heeft het geld
// gekregen en weet dus zeker dat het binnen is. Zou de schuldenaar zelf mogen afvinken,
// dan kan iemand zijn schuld "wegklikken" zonder te betalen.
// RLS kan dat niet afdwingen (die policy kijkt alleen naar de groep), dus doen we het
// hier: we filteren de update op buyer_id = jij.

const ReimburseSchema = z.object({
  ticketId: z.uuid({ error: "Ongeldig ticket" }),
  reimbursed: z.boolean(),
});

// Eén ticket afvinken (reimbursed = true) of per ongeluk afgevinkt terugdraaien (false).
export async function setReimbursed(ticketId: string, reimbursed: boolean): Promise<TicketFormState> {
  const parsed = ReimburseSchema.safeParse({ ticketId, reimbursed });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Niet ingelogd" };

  const { data, error } = await supabase
    .from("tickets")
    .update({
      reimbursed: parsed.data.reimbursed,
      // Wanneer terugbetaald, of weer leeg als we het terugdraaien
      reimbursed_at: parsed.data.reimbursed ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.ticketId)
    .eq("buyer_id", user.id) // ← de regel "alleen de koper"
    .select("event_id")
    .maybeSingle();
  if (error) return { error: error.message };
  // 0 rijen: het ticket bestaat niet, of jij bent niet de koper
  if (!data) return { error: "Alleen wie het ticket betaalde, kan dit afvinken" };

  revalidatePath(`/gigs/${data.event_id}`);
  revalidatePath("/debts");
  return { success: true };
}

// Een hele schuld in één keer vereffenen: "Jan heeft me alles terugbetaald".
// Vinkt alle openstaande tickets af die jij kocht voor debtorId, in jouw huidige groep.
// Dat is precies de rij die de view open_debts toont, dus na afloop verdwijnt die rij.
export async function settleDebt(debtorId: string): Promise<TicketFormState> {
  const id = z.uuid().safeParse(debtorId);
  if (!id.success) return { error: "Ongeldige persoon" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Niet ingelogd" };

  const group = await getCurrentGroup();
  if (!group) return { error: "Je zit nog in geen groep" };

  // Een update kan niet filteren op een kolom van een andere tabel (events.group_id).
  // Dus eerst de id's van de events van de groep ophalen, en dan .in("event_id", ...).
  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("id")
    .eq("group_id", group.id);
  if (eventsError) return { error: eventsError.message };

  const { data, error } = await supabase
    .from("tickets")
    .update({ reimbursed: true, reimbursed_at: new Date().toISOString() })
    .eq("buyer_id", user.id)
    .eq("holder_id", id.data)
    .eq("reimbursed", false) // al afgevinkte tickets laten we met rust (hun datum blijft)
    .in("event_id", events.map((e) => e.id))
    .select("event_id");
  if (error) return { error: error.message };
  if (data.length === 0) return { error: "Er stond niets open" };

  revalidatePath("/debts");
  // Alle betrokken detailpagina's verversen. new Set: elke gig maar één keer.
  for (const eventId of new Set(data.map((t) => t.event_id))) {
    revalidatePath(`/gigs/${eventId}`);
  }
  return { success: true };
}
