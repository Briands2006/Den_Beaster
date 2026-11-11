import Link from "next/link";
import { Plus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { getCurrentGroup } from "@/lib/groups";

// 🔥 Upcoming Gigs. De lijst zelf komt in stap 4 van feature 2.
// Async Server Component: de (app)-layout zet dit al binnen <Suspense>,
// dus we mogen hier gewoon cookies/data lezen.
export default async function UpcomingGigsPage() {
  const group = await getCurrentGroup();
  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-5xl text-primary">Upcoming Gigs</h1>
          <p className="text-muted-foreground">{group?.name}</p>
        </div>
        <Link href="/gigs/new" className={buttonVariants()}>
          <Plus /> Gig
        </Link>
      </div>
      <p className="text-muted-foreground">De lijst met gigs komt in de volgende stap 🤘</p>
    </>
  );
}
