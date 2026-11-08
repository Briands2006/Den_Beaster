import { Suspense } from "react";
import { JoinGroupForm } from "@/components/group-forms";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// De invite-link: /join/3f9a1c0e
//
// Waarom een knop en niet meteen joinen bij het openen van de link?
// Een GET-aanvraag hoort niets te veranderen. Mailscanners en link-previews
// (WhatsApp, Messenger) openen links automatisch. Zonder knop zouden die "joinen".
//
// [code] in de mapnaam = dynamisch segment. params is een Promise, en met cacheComponents
// moet je die binnen <Suspense> uitlezen (de waarde is pas bij het bezoek gekend).
export default function JoinPage({ params }: PageProps<"/join/[code]">) {
  return (
    <main className="mx-auto w-full max-w-sm p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Join de groep 🤘</CardTitle>
          <CardDescription>Je bent uitgenodigd. Klik op de knop om erbij te komen.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            {params.then(({ code }) => (
              <JoinGroupForm defaultCode={code} />
            ))}
          </Suspense>
        </CardContent>
      </Card>
    </main>
  );
}
