import { getCurrentGroup } from "@/lib/groups";

// 🔥 Upcoming Gigs. Wordt ingevuld in feature 2 (events).
// Async Server Component: de (app)-layout zet dit al binnen <Suspense>,
// dus we mogen hier gewoon cookies/data lezen.
export default async function UpcomingGigsPage() {
  const group = await getCurrentGroup();
  return (
    <>
      <div>
        <h1 className="font-heading text-5xl text-primary">Upcoming Gigs</h1>
        <p className="text-muted-foreground">{group?.name}</p>
      </div>
      <p className="text-muted-foreground">Nog geen gigs. Die kun je toevoegen in de volgende feature 🤘</p>
    </>
  );
}
