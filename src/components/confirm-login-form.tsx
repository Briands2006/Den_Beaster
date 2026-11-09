"use client";
import Link from "next/link";
import { useActionState } from "react";
import { confirmLogin, type ConfirmState } from "@/app/auth/confirm/actions";
import { Button } from "@/components/ui/button";

type Props = { code?: string; tokenHash?: string; type?: string };

// De gegevens uit de mail-link reizen mee als verborgen velden (type="hidden").
// Pas bij het klikken op de knop gaan ze naar de Server Action.
export function ConfirmLoginForm({ code, tokenHash, type }: Props) {
  const [state, formAction, pending] = useActionState<ConfirmState, FormData>(confirmLogin, null);

  if (!code && !tokenHash) {
    return (
      <p className="text-sm text-destructive">
        Deze link is onvolledig.{" "}
        <Link href="/login" className="underline">
          Vraag een nieuwe aan
        </Link>
        .
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      {code && <input type="hidden" name="code" value={code} />}
      {tokenHash && <input type="hidden" name="token_hash" value={tokenHash} />}
      {type && <input type="hidden" name="type" value={type} />}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Bezig…" : "Inloggen"}
      </Button>

      {state?.error && (
        <p className="text-sm text-destructive">
          {state.error}{" "}
          <Link href="/login" className="underline">
            Naar login
          </Link>
        </p>
      )}
    </form>
  );
}
