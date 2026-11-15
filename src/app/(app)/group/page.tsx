import { LogOut } from "lucide-react";
import { logout } from "@/app/login/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InviteLink } from "@/components/invite-link";
import { getCurrentGroup } from "@/lib/groups";
import { createClient } from "@/lib/supabase/server";

// 👥 Groep: wie zit erin, en de invite-link om vrienden toe te voegen.
export default async function GroupPage() {
  const group = await getCurrentGroup();
  if (!group) return null; // kan niet: de layout stuurt je dan al naar /welcome

  const supabase = await createClient();
  // profiles(...) = "embed": Supabase volgt de foreign key group_members.profile_id → profiles
  // en geeft het profiel mee in hetzelfde antwoord. Eén query in plaats van twee.
  const [{ data: members }, { data: { user } }] = await Promise.all([
    supabase
      .from("group_members")
      .select("role, profiles(id, display_name)")
      .eq("group_id", group.id),
    supabase.auth.getUser(),
  ]);

  return (
    <>
      <div>
        <h1 className="font-heading text-5xl text-primary">{group.name}</h1>
        <p className="text-muted-foreground">{members?.length ?? 0} leden</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Vrienden uitnodigen</CardTitle>
          <CardDescription>
            Stuur de link door. Wie hem opent en inlogt, kan de groep joinen.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InviteLink code={group.invite_code} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Leden</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {members?.map((m) => (
              <li key={m.profiles.id} className="flex items-center justify-between py-2">
                <span className="text-lg">
                  {m.profiles.display_name}
                  {m.profiles.id === user?.id && <span className="text-muted-foreground"> (ik)</span>}
                </span>
                {m.role === "admin" && <Badge variant="secondary">admin</Badge>}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Zo zie je altijd als wie je ingelogd bent (handig met meerdere accounts) */}
      <div className="flex items-center justify-between gap-4">
        <p className="min-w-0 truncate text-muted-foreground">Ingelogd als {user?.email}</p>
        <form action={logout}>
          <Button type="submit" variant="outline">
            <LogOut /> Uitloggen
          </Button>
        </form>
      </div>
    </>
  );
}
