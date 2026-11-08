"use client";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendMagicLink, type LoginState } from "./actions";

export default function LoginPage() {
  // useActionState koppelt het formulier aan de Server Action en geeft terug:
  // - state: wat de action het laatst teruggaf ({ error } of { success })
  // - formAction: wat je aan <form action={…}> geeft
  // - pending: true zolang de action bezig is (om de knop uit te schakelen)
  const [state, formAction, pending] = useActionState<LoginState, FormData>(sendMagicLink, null);

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-4xl text-primary">Pit Ledger 🤘</CardTitle>
          <CardDescription>Log in met een link in je mailbox. Geen wachtwoord nodig.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mailadres</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="jij@voorbeeld.be"
              />
            </div>

            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Bezig…" : "Stuur mij een loginlink"}
            </Button>

            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            {state?.success && <p className="text-sm text-muted-foreground">{state.success}</p>}
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
