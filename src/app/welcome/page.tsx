import { CreateGroupForm, JoinGroupForm } from "@/components/group-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Wie ingelogd is maar nog in geen enkele groep zit, komt hier terecht
// (de (app)-layout stuurt je door). Deze pagina staat bewust BUITEN (app):
// zonder groep heeft de navigatiebalk geen zin.
export default function WelcomePage() {
  return (
    <main className="mx-auto w-full max-w-sm space-y-6 p-4">
      <div>
        <h1 className="font-heading text-5xl text-primary">Welkom 🤘</h1>
        <p className="text-muted-foreground">
          Alles in Pit Ledger hoort bij een groep. Start er zelf een, of join die van een vriend.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Nieuwe groep</CardTitle>
          <CardDescription>Jij wordt admin en krijgt een invite-link om te delen.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateGroupForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Bestaande groep</CardTitle>
          <CardDescription>Vraag de invite-code aan iemand uit de groep.</CardDescription>
        </CardHeader>
        <CardContent>
          <JoinGroupForm />
        </CardContent>
      </Card>
    </main>
  );
}
