"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ConfirmState = { error?: string } | null;

// De types die Supabase in een mail-link kan meegeven. Formulierdata is onbetrouwbaar,
// dus we laten alleen deze waarden door (zod controleert dat).
const otpType = z.enum(["email", "magiclink", "signup", "invite", "recovery", "email_change"]);

const EXPIRED = "Deze link is ongeldig of verlopen. Vraag een nieuwe aan.";

// Server Action: wordt pas uitgevoerd als iemand op de knop drukt (POST).
// Hier wordt de eenmalige token echt "opgebruikt" en de sessie-cookie gezet.
//
// Twee varianten, net als vroeger in route.ts:
// 1. code       → PKCE-flow (standaardtemplate van Supabase), werkt enkel in dezelfde browser
// 2. token_hash → ons eigen mailtemplate, werkt in elke browser
export async function confirmLogin(_prev: ConfirmState, formData: FormData): Promise<ConfirmState> {
  const supabase = await createClient();
  const code = formData.get("code");
  const tokenHash = formData.get("token_hash");

  if (typeof code === "string" && code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return { error: EXPIRED };
  } else if (typeof tokenHash === "string" && tokenHash) {
    const type = otpType.safeParse(formData.get("type"));
    if (!type.success) return { error: EXPIRED };
    const { error } = await supabase.auth.verifyOtp({ type: type.data, token_hash: tokenHash });
    if (error) return { error: EXPIRED };
  } else {
    return { error: "Deze link is onvolledig. Vraag een nieuwe aan." };
  }

  // redirect() gooit intern een speciale "fout" die Next opvangt; daarom staat hij
  // buiten de if-blokken en komt er niets meer na.
  redirect("/");
}
