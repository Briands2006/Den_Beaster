import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

// In welke groep zit de ingelogde gebruiker?
// Voorlopig is dat de oudste groep waarvan je lid bent. Wil je later meerdere groepen
// ondersteunen, dan voeg je hier een "actieve groep" toe (bv. in een cookie).
//
// We hoeven niet te filteren op "waar ben ik lid van": RLS doet dat al.
// De policy "zie eigen groepen" geeft alleen groepen terug waarvan je lid bent.
//
// cache() (van React): binnen één paginabezoek draait de query maar één keer,
// ook als zowel de layout als de pagina getCurrentGroup() aanroepen.
export const getCurrentGroup = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("groups")
    .select("id, name, invite_code")
    .order("created_at")
    .limit(1)
    .maybeSingle(); // null als er geen rij is, in plaats van een fout
  return data;
});

// Alle leden van een groep, alfabetisch: { id, display_name }[].
// Gebruikt voor de keuzelijst "voor wie is het ticket?".
// RLS ("zie medeleden") zorgt dat je alleen leden ziet van een groep waar je zelf in zit.
export const getGroupMembers = cache(async (groupId: string) => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("group_members")
    .select("profiles(id, display_name)")
    .eq("group_id", groupId);
  if (error) throw error;
  // Het embed geeft [{ profiles: {...} }]: we halen die tussenlaag weg en sorteren in JS,
  // want sorteren op een kolom van een embedded tabel is in Supabase omslachtig.
  return data
    .map((m) => m.profiles)
    .sort((a, b) => a.display_name.localeCompare(b.display_name, "nl"));
});
