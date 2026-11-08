import { Suspense } from "react";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/bottom-nav";
import { getCurrentGroup } from "@/lib/groups";

// Layout voor alle pagina's in de route group (app). De map "(app)" telt niet mee in de URL:
// (app)/debts/page.tsx is gewoon /debts. Alle ingelogde schermen delen zo de navigatiebalk.
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* pb-24: ruimte onderaan, zodat de vaste navigatiebalk niets bedekt */}
      <main className="mx-auto w-full max-w-2xl flex-1 space-y-6 p-4 pb-24">
        <Suspense fallback={<p className="text-muted-foreground">Laden…</p>}>
          <GroupGate>{children}</GroupGate>
        </Suspense>
      </main>
      <BottomNav />
    </>
  );
}

// Zit je nog in geen groep? Dan heeft geen enkele pagina hier zin → naar /welcome.
// Dit leest cookies (wie ben je), dus het staat in <Suspense> (cacheComponents).
async function GroupGate({ children }: { children: React.ReactNode }) {
  const group = await getCurrentGroup();
  if (!group) redirect("/welcome");
  return children;
}
