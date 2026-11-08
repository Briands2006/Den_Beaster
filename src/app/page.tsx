import { Suspense } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

// Tijdelijke startpagina: toont dat login en thema werken.
// In stap 10 wordt dit de "Upcoming Gigs"-pagina.
//
// Met cacheComponents (next.config.ts) maakt Next.js van alles wat voor iedereen gelijk is
// vooraf een statische "schil". Alles wat per bezoeker verschilt (cookies → wie is ingelogd)
// moet in een <Suspense>: dat stuk wordt pas bij het bezoek ingevuld.
export default function Home() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-4">
      <h1 className="font-heading text-5xl text-primary">Pit Ledger</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Welkom in de pit 🤘</CardTitle>
          <Suspense fallback={<CardDescription>Even kijken wie je bent…</CardDescription>}>
            <LoggedInAs />
          </Suspense>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Ticket Slayer – Antwerpen: <span className="font-semibold">€ 65,50</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <Badge>Terugbetaald</Badge>
            <Badge variant="secondary">Open</Badge>
            <Badge variant="destructive">Te laat</Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Verwijderen</Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

// Async Server Component: leest de cookies (via Supabase) en is dus per bezoeker anders.
async function LoggedInAs() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return <CardDescription>Ingelogd als {user?.email}</CardDescription>;
}
