"use client";
import { useActionState } from "react";
import { sendMagicLink, type LoginState } from "./actions";

export default function LoginPage() {
  // useActionState koppelt het formulier aan de Server Action en geeft terug:
  // - state: wat de action het laatst teruggaf ({ error } of { success })
  // - formAction: wat je aan <form action={…}> geeft
  // - pending: true zolang de action bezig is (om de knop uit te schakelen)
  const [state, formAction, pending] = useActionState<LoginState, FormData>(sendMagicLink, null);

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form action={formAction} className="w-full max-w-sm space-y-4">
        <h1 className="text-3xl font-bold">Pit Ledger 🤘</h1>

        <label htmlFor="email" className="block text-sm font-medium">
          E-mailadres
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded border px-3 py-2"
          placeholder="jij@voorbeeld.be"
        />

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-red-700 px-3 py-2 font-semibold text-white disabled:opacity-50"
        >
          {pending ? "Bezig…" : "Stuur mij een loginlink"}
        </button>

        {state?.error && <p className="text-sm text-red-500">{state.error}</p>}
        {state?.success && <p className="text-sm text-green-500">{state.success}</p>}
      </form>
    </main>
  );
}
