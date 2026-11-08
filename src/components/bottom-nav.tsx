"use client";
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
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 border-t bg-background pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex max-w-2xl">
        {items.map(({ href, label, icon: Icon }) => {
          // "/" is alleen actief op exact "/", anders zou het overal actief zijn.
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
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
    </nav>
  );
}
