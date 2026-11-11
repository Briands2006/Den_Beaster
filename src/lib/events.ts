import { cache } from "react";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

// Eén gig ophalen, of null als hij niet bestaat of niet van jouw groep is.
// Gebruikt door /gigs/[id] en /gigs/[id]/edit. cache(): binnen één paginabezoek maar één query.
export const getEvent = cache(async (id: string) => {
  // Het id komt uit de URL, dus iedereen kan er van alles typen. Geen uuid → bestaat niet.
  // Zonder deze controle zou Postgres een fout geven ("invalid input syntax for type uuid").
  if (!z.uuid().safeParse(id).success) return null;

  const supabase = await createClient();
  // RLS: een gig van een andere groep krijg je gewoon niet terug → null.
  const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();
  if (error) throw error; // echte fout (bv. database onbereikbaar) → foutpagina, geen 404
  return data;
});
