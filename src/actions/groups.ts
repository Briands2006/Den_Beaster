"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string } | null;

const NameSchema = z
  .string({ error: "Vul een naam in" })
  .trim()
  .min(2, "Minstens 2 tekens")
  .max(50, "Maximaal 50 tekens");

// Invite-codes maakt de database met substr(md5(...), 1, 8): 8 tekens 0-9 en a-f.
// toLowerCase() vangt op dat iemand de code in hoofdletters overtypt.
const CodeSchema = z
  .string({ error: "Vul een invite-code in" })
  .trim()
  .toLowerCase()
  .regex(/^[0-9a-f]{8}$/, "Een invite-code bestaat uit 8 tekens (0-9 en a-f)");

export async function createGroup(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = NameSchema.safeParse(formData.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  // created_by vullen we niet zelf in: de database gebruikt default auth.uid().
  // De trigger on_group_created maakt je daarna automatisch admin van de groep.
  const { error } = await supabase.from("groups").insert({ name: parsed.data });
  if (error) return { error: error.message };

  // redirect() werkt met een "exception", dus dit staat buiten elke try/catch.
  redirect("/");
}

export async function joinGroup(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = CodeSchema.safeParse(formData.get("code"));
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  // Een niet-lid mag de groep niet zien (RLS), dus kan hij zichzelf ook niet toevoegen.
  // De databasefunctie join_group (security definer) is de gecontroleerde uitzondering:
  // ze zoekt de groep bij de code en voegt jou toe als 'member'.
  const { error } = await supabase.rpc("join_group", { code: parsed.data });
  if (error) return { error: error.message }; // bv. "Ongeldige invite-code"

  redirect("/");
}
