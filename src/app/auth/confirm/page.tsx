import { Suspense } from "react";
import { ConfirmLoginForm } from "@/components/confirm-login-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Hier komt de magic link uit de mail op uit: /auth/confirm?token_hash=…&type=email
//
// Waarom een knop en niet meteen inloggen bij het openen van de link?
// Mailscanners (bv. Microsoft Safe Links bij school- en bedrijfsmail) openen links
// automatisch om ze te controleren. De token is eenmalig: zou een GET al inloggen,
// dan "gebruikt" de scanner de token op en krijg jij een foutmelding.
// Een scanner opent pagina's, maar drukt niet op knoppen (POST).
//
// searchParams is een Promise; met cacheComponents lezen we die binnen <Suspense> uit.
export default function ConfirmPage({ searchParams }: PageProps<"/auth/confirm">) {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-4xl text-primary">Pit Ledger 🤘</CardTitle>
          <CardDescription>Klik op de knop om in te loggen.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            {searchParams.then((sp) => (
              <ConfirmLoginForm code={one(sp.code)} tokenHash={one(sp.token_hash)} type={one(sp.type)} />
            ))}
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}

// Een query-parameter kan meerdere keren voorkomen (?a=1&a=2 → array). Wij willen één string.
function one(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined;
}
