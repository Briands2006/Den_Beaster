"use client";
import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Droplet, Flame, Skull, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/", label: "Gigs", icon: Flame },
  { href: "/debts", label: "Debts", icon: Droplet },
  { href: "/archive", label: "Hall of Fame", icon: Skull },
  { href: "/group", label: "Groep", icon: Users },
] as const;

// Client Component, omdat usePathname() in de browser moet weten op welke pagina je zit
// (om dat item rood te kleuren). De rest van de app blijft server-side.
//
// Waarom de <Suspense>? Met cacheComponents probeert Next tijdens de build zoveel mogelijk
// HTML vooraf te maken. Op /gigs/[id] is het id pas bekend als iemand de pagina opent,
// dus usePathname() kan dan nog geen antwoord geven en "wacht" (suspend).
// Zonder Suspense faalt de build. Met Suspense maakt Next vooraf de navigatiebalk zonder
// rood item (de fallback) en vult hij het actieve item in zodra de URL bekend is.
export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <Suspense fallback={<NavItems pathname={null} />}>
        <ActiveNavItems />
      </Suspense>
    </nav>
  );
}

function ActiveNavItems() {
  return <NavItems pathname={usePathname()} />;
}

function NavItems({ pathname }: { pathname: string | null }) {
  return (
    <ul className="mx-auto flex max-w-2xl">
      {items.map(({ href, label, icon: Icon }) => {
        // "/" is alleen actief op exact "/", anders zou het overal actief zijn.
        // /gigs/... hoort ook bij "Gigs".
        const active =
          pathname !== null &&
          (href === "/" ? pathname === "/" || pathname.startsWith("/gigs") : pathname.startsWith(href));
        return (
          <li key={href} className="flex-1">
            <Link
              href={href}
              // aria-current: een schermlezer zegt "huidige pagina"
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2 text-xs text-muted-foreground",
                active && "text-primary"
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
