"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentGroup } from "@/lib/groups";
import { createClient } from "@/lib/supabase/server";

// Wat de formulieren terugkrijgen als er iets misloopt.
// `values`: wat de gebruiker had ingevuld. React maakt een formulier leeg na het versturen,
// dus zonder dit zou je bij een foutmelding alles opnieuw moeten typen.
export type EventFormState = {
  error?: string;
  values?: Record<string, string>;
} | null;

// Optioneel tekstveld: een leeg veld komt uit het formulier als "", maar in de database
// willen we dan null ("niet ingevuld"), geen lege tekst.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Maximaal ${max} tekens`)
    .optional()
    .transform((v) => v || null);

// Het schema beschrijft hoe een geldig event eruitziet. Formulierdata is altijd tekst
// en altijd onbetrouwbaar (iedereen kan een request namaken), dus we controleren alles.
// Let op: group_id staat hier NIET in. Die bepalen we zelf op de server, zodat niemand
// een event in andermans groep kan stoppen door een veld toe te voegen.
const EventSchema = z.object({
  artist: z
    .string({ error: "Vul een artiest in" })
    .trim()
    .min(1, "Vul een artiest in")
    .max(100, "Maximaal 100 tekens"),
  venue: optionalText(100),
  city: optionalText(60),
  // <input type="date"> stuurt altijd "YYYY-MM-DD". z.iso.date() controleert precies dat.
  eventDate: z.iso.date({ error: "Kies een geldige datum" }),
  notes: optionalText(500),
});

// Ook het id dat we meekrijgen (bij wijzigen/verwijderen) komt van de browser → controleren.
const IdSchema = z.uuid({ error: "Ongeldig event" });

// Leest het formulier en controleert het. Geeft ofwel de data, ofwel een foutstatus terug.
function parseEvent(formData: FormData) {
  // Object.fromEntries maakt van het formulier een gewoon object: { artist: "...", ... }.
  // Bestanden kunnen we niet gebruiken, dus we houden alleen tekstvelden over.
  const raw = Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string")
  ) as Record<string, string>;

  const parsed = EventSchema.safeParse(raw);
  if (!parsed.success) {
    return { state: { error: parsed.error.issues[0].message, values: raw } } as const;
  }
  return { data: parsed.data, raw } as const;
}

// Van camelCase in de code naar snake_case in de database.
const toRow = (d: z.infer<typeof EventSchema>) => ({
  artist: d.artist,
  venue: d.venue,
  city: d.city,
  event_date: d.eventDate,
  notes: d.notes,
});

export async function createEvent(_prev: EventFormState, formData: FormData): Promise<EventFormState> {
  const result = parseEvent(formData);
  if (result.state) return result.state;

  const group = await getCurrentGroup();
  if (!group) return { error: "Je zit nog in geen groep" };

  const supabase = await createClient();
  // .select("id").single(): geef het nieuwe id terug, zodat we naar de detailpagina kunnen.
  // RLS ("events van eigen groep") controleert in de database nog eens dat je lid bent.
  const { data, error } = await supabase
    .from("events")
    .insert({ ...toRow(result.data), group_id: group.id })
    .select("id")
    .single();
  if (error) return { error: error.message, values: result.raw };

  // De lijst op "/" is nu verouderd → opnieuw opbouwen.
  revalidatePath("/");
  redirect(`/gigs/${data.id}`);
}

// eventId komt via .bind() van de pagina: updateEvent.bind(null, event.id).
// Zo hoeft het id niet als verborgen veld in het formulier te staan.
export async function updateEvent(
  eventId: string,
  _prev: EventFormState,
  formData: FormData
): Promise<EventFormState> {
  const id = IdSchema.safeParse(eventId);
  if (!id.success) return { error: id.error.issues[0].message };

  const result = parseEvent(formData);
  if (result.state) return result.state;

  const supabase = await createClient();
  // Valkuil: mag je een rij niet zien (RLS), dan geeft een update GEEN fout,
  // hij past gewoon 0 rijen aan. Met .select() krijgen we de aangepaste rijen terug
  // en kunnen we zien of er echt iets gebeurd is.
  const { data, error } = await supabase
    .from("events")
    .update(toRow(result.data))
    .eq("id", id.data)
    .select("id");
  if (error) return { error: error.message, values: result.raw };
  if (data.length === 0) return { error: "Event niet gevonden", values: result.raw };

  revalidatePath("/");
  revalidatePath("/archive"); // de datum kan veranderd zijn, dus misschien hoort hij nu in het archief
  revalidatePath(`/gigs/${id.data}`);
  redirect(`/gigs/${id.data}`);
}

export async function deleteEvent(eventId: string): Promise<EventFormState> {
  const id = IdSchema.safeParse(eventId);
  if (!id.success) return { error: id.error.issues[0].message };

  const supabase = await createClient();
  // De tickets van dit event verdwijnen mee: in het schema staat "on delete cascade".
  const { data, error } = await supabase.from("events").delete().eq("id", id.data).select("id");
  if (error) return { error: error.message };
  if (data.length === 0) return { error: "Event niet gevonden" };

  revalidatePath("/");
  revalidatePath("/archive");
  revalidatePath("/debts"); // met de tickets verdwijnen ook hun openstaande schulden
  redirect("/");
}
