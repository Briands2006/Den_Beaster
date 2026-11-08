"use client";
import { useActionState } from "react";
import { createGroup, joinGroup, type FormState } from "@/actions/groups";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Zelfde patroon als de loginpagina: useActionState koppelt het formulier aan de Server Action.
// Lukt de action, dan stuurt ze je door (redirect) en zie je dit formulier niet meer.
// Lukt ze niet, dan komt { error } terug en tonen we die onder het formulier.

export function CreateGroupForm() {
  const [state, formAction, pending] = useActionState<FormState, FormData>(createGroup, null);
  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="name">Naam van de groep</Label>
        <Input id="name" name="name" required maxLength={50} placeholder="De Moshpit Maffia" />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Bezig…" : "Groep aanmaken"}
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}

export function JoinGroupForm({ defaultCode }: { defaultCode?: string }) {
  const [state, formAction, pending] = useActionState<FormState, FormData>(joinGroup, null);
  return (
    <form action={formAction} className="space-y-3">
      <div className="space-y-2">
        <Label htmlFor="code">Invite-code</Label>
        <Input
          id="code"
          name="code"
          required
          defaultValue={defaultCode}
          autoComplete="off"
          placeholder="bv. 3f9a1c0e"
          className="font-mono"
        />
      </div>
      <Button type="submit" disabled={pending} variant="secondary" className="w-full">
        {pending ? "Bezig…" : "Groep joinen"}
      </Button>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
    </form>
  );
}
