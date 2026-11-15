import { SettleDebtButton } from "@/components/settle-debt-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { euro } from "@/lib/format";
import { getCurrentGroup, getGroupMembers } from "@/lib/groups";
import { createClient } from "@/lib/supabase/server";

// 🩸 Blood Debts: wie moet wie nog hoeveel?
// De cijfers komen uit de view open_debts: die telt LIVE de tickets op die niet
// terugbetaald zijn en waar koper ≠ houder. We bewaren schulden dus nergens apart,
// waardoor ze nooit uit sync kunnen raken met de tickets.
export default async function DebtsPage() {
  const group = await getCurrentGroup();
  if (!group) return null; // kan niet: de layout stuurt je dan al naar /welcome

  const supabase = await createClient();
  const [{ data: rows, error }, members, { data: { user } }] = await Promise.all([
    supabase
      .from("open_debts")
      .select("*")
      .eq("group_id", group.id)
      .order("amount_cents", { ascending: false }), // grootste schuld bovenaan
    getGroupMembers(group.id),
    supabase.auth.getUser(),
  ]);
  if (error) throw error;
  if (!user) return null;

  // Van id naar naam. Een Map zoekt meteen op, zonder elke keer de hele lijst te doorlopen.
  const names = new Map(members.map((m) => [m.id, m.display_name]));
  const nameOf = (id: string) => names.get(id) ?? "Oud lid";

  // De gegenereerde types van een view zijn altijd "| null": Postgres kan bij een view
  // niet garanderen dat een kolom nooit leeg is. Wij weten (uit de SQL) dat ze altijd
  // gevuld zijn, dus zetten we ze één keer om naar nette, niet-lege waarden.
  const debts = rows.map((r) => ({
    debtorId: r.debtor_id ?? "",
    creditorId: r.creditor_id ?? "",
    amount: r.amount_cents ?? 0,
    count: r.ticket_count ?? 0,
  }));

  // Drie groepen: wat jij krijgt, wat jij moet, en wat anderen onder elkaar moeten.
  const toMe = debts.filter((d) => d.creditorId === user.id);
  const fromMe = debts.filter((d) => d.debtorId === user.id);
  const others = debts.filter((d) => d.creditorId !== user.id && d.debtorId !== user.id);

  const sum = (list: typeof debts) => list.reduce((total, d) => total + d.amount, 0);
  const tickets = (n: number) => (n === 1 ? "1 ticket" : `${n} tickets`);

  return (
    <>
      <div>
        <h1 className="font-heading text-5xl text-primary">Blood Debts</h1>
        <p className="text-muted-foreground">{group.name}</p>
      </div>

      {debts.length === 0 && (
        <p className="text-lg">Niemand is iemand iets schuldig. De pit is vrede. 🤘</p>
      )}

      {toMe.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between text-2xl">
              <span>Jij krijgt nog</span>
              <span className="tabular-nums">{euro(sum(toMe))}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {toMe.map((d) => (
                <li key={d.debtorId} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg">{nameOf(d.debtorId)}</p>
                    <p className="text-sm text-muted-foreground">{tickets(d.count)}</p>
                  </div>
                  <span className="text-lg tabular-nums">{euro(d.amount)}</span>
                  {/* Alleen hier een knop: alleen de koper mag afvinken (zie settleDebt) */}
                  <SettleDebtButton
                    debtorId={d.debtorId}
                    name={nameOf(d.debtorId)}
                    amount={euro(d.amount)}
                  />
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {fromMe.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex justify-between text-2xl">
              <span>Jij moet nog</span>
              <span className="tabular-nums text-primary">{euro(sum(fromMe))}</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {fromMe.map((d) => (
                <li key={d.creditorId} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-lg">aan {nameOf(d.creditorId)}</p>
                    <p className="text-sm text-muted-foreground">{tickets(d.count)}</p>
                  </div>
                  <span className="text-lg tabular-nums">{euro(d.amount)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-sm text-muted-foreground">
              Betaald? Dan vinkt {fromMe.length === 1 ? nameOf(fromMe[0].creditorId) : "de koper"} het af.
            </p>
          </CardContent>
        </Card>
      )}

      {others.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Tussen de anderen</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {others.map((d) => (
                <li
                  key={`${d.debtorId}-${d.creditorId}`}
                  className="flex items-center gap-3 py-3 text-muted-foreground"
                >
                  <p className="min-w-0 flex-1 truncate">
                    {nameOf(d.debtorId)} → {nameOf(d.creditorId)}
                  </p>
                  <span className="tabular-nums">{euro(d.amount)}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </>
  );
}
