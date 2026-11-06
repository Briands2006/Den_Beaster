"use server";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; success?: string } | null;

// Server Action: draait alleen op de server, wordt aangeroepen vanuit het formulier.
export async function sendMagicLink(_prev: LoginState, formData: FormData): Promise<LoginState> {
  // Formulierdata is onbetrouwbaar: eerst controleren of het echt een e-mailadres is.
  const parsed = z.email().safeParse(formData.get("email"));
  if (!parsed.success) return { error: "Dat is geen geldig e-mailadres" };

  // origin = het adres van waaruit het formulier verstuurd werd
  // (localhost, een preview-URL of productie), zodat de link terugkeert naar dezelfde plek.
  const origin = (await headers()).get("origin");
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${origin}/auth/confirm` },
  });
  return error ? { error: error.message } : { success: "Check je mailbox 🤘" };
}
