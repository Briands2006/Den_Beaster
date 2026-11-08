"use client";
import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

// Client Component: het klembord (navigator.clipboard) en window.location bestaan alleen in de browser.
// window.location.origin = het adres waarop je nu zit (localhost of projectjen.vercel.app),
// zodat de link altijd klopt met de omgeving waarin je hem kopieert.
export function InviteLink({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(`${window.location.origin}/join/${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm text-muted-foreground">Invite-code</p>
        <p className="font-mono text-xl">{code}</p>
      </div>
      <Button onClick={copy} variant="outline">
        {copied ? <Check /> : <Copy />}
        {copied ? "Gekopieerd!" : "Kopieer link"}
      </Button>
    </div>
  );
}
