import { type EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Route Handler: hier komt de magic link uit de mail op uit. Twee varianten:
//
// 1. /auth/confirm?code=…
//    Standaardtemplate van Supabase (PKCE-flow). Werkt alleen in dezelfde browser
//    waarin de link aangevraagd werd, want daar staat de "code verifier"-cookie.
//
// 2. /auth/confirm?token_hash=…&type=email
//    Eigen template (kan pas met eigen SMTP). Werkt in elke browser.
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();

  if (code) {
    // Wissel de eenmalige code in voor een sessie; de server-client zet de sessie-cookie.
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect("/");
  } else if (token_hash && type) {
    // Supabase controleert de token; is die geldig, dan zet de server-client de sessie-cookie.
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) redirect("/");
  }
  redirect("/login?error=link");
}
