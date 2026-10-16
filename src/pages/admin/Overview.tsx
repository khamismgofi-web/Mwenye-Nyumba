import { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { UnitTile } from '../../components/UnitTile';
import { totals } from '../../components/Notebook';
import { Button, Empty, PageHead, Pill, Spinner, useAction } from '../../components/ui';
import { effectiveStatus, unitTone } from '../../lib/derive';
import { api } from '../../lib/api';
import { daysUntil, money, shortDate, todayIso } from '../../lib/format';
import { Link } from '../../lib/router';
import { useData } from './data';

function Bars({ data }: { data: { label: string; billed: number; collected: number }[] }) {
  const max = Math.max(1, ...data.flatMap((d) => [d.billed, d.collected]));
  const summary = data.map((d) => `${d.label}: ${money(d.collected)} of ${money(d.billed)}`).join('. ');
  return (
    <svg viewBox="0 0 480 170" role="img" aria-label={`Rent collected against billed. ${summary}`} className="w-full">
      <line x1="0" x2="480" y1="136" y2="136" stroke="#12201b" strokeWidth="1.5" />
      {data.map((d, i) => {
        const x = 12 + i * 78;
        const hb = (d.billed / max) * 120;
        const hc = (d.collected / max) * 120;
        return (
          <g key={d.label}>
            <rect x={x} y={136 - hb} width="26" height={hb} rx="3" fill="#d3dbd6">
              <title>{`Billed ${money(d.billed)}`}</title>
            </rect>
            <rect x={x + 30} y={136 - hc} width="26" height={hc} rx="3" fill="#0f5c4e">
              <title>{`Collected ${money(d.collected)}`}</title>
            </rect>
            <text x={x + 28} y="156" textAnchor="middle" fontSize="12" fill="#4f5d56">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function GettingStarted() {
  const { properties, units, payments, tenants, invites, entries } = useData();
  const steps = [
    { done: properties.length > 0, label: 'Add your first property', to: '/admin/properties' },
    { done: units.length > 0, label: 'Add a unit with its rent', to: '/admin/properties' },
    { done: units.some((u) => u.photo_url), label: 'Take a photo of a unit', to: '/admin/properties' },
    { done: tenants.length > 0 || invites.length > 0, label: 'Invite your first tenant', to: '/admin/properties' },
    { done: payments.length > 0, label: 'Add a rent charge', to: '/admin/rent' },
    { done: entries.length > 0, label: 'Write your first plan in the Notebook', to: '/admin/notebook' },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  if (doneCount === steps.length) return null;
  const next = steps.find((s) => !s.done)!;
  return (
    <section className="mb-8 overflow-hidden rounded-2xl bg-pine-deep p-6 text-white">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Get set up in {steps.length - doneCount} more {steps.length - doneCount === 1 ? 'step' : 'steps'}</h2>
          <p className="mt-1 text-white/70">Do these once and your notebook is retired.</p>
        </div>
        <Link to={next.to} className="rounded-lg bg-ochre px-4 py-2.5 text-sm font-semibold text-ink hover:brightness-95">
          Next: {next.label}
        </Link>
      </div>
      <ol className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s) => (
          <li key={s.label}>
            <Link to={s.to} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${s.done ? 'bg-white/5 text-white/60' : 'bg-white/10 text-white hover:bg-white/15'}`}>
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${s.done ? 'bg-ochre text-ink' : 'border border-white/40'}`}>
                {s.done && <Check size={14} />}
              </span>
              <span className={s.done ? 'line-through' : ''}>{s.label}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export default function Overview() {
  const { properties, units, tenants, payments, repairs, entries, loading, error, reload } = useData();
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const { busy, run } = useAction();

  const stats = useMemo(() => {
    const month = todayIso().slice(0, 7);
    const eff = payments.map((p) => ({ ...p, status: effectiveStatus(p) }));
    const collected = eff.filter((p) => p.status === 'paid' && (p.paid_date || p.due_date).startsWith(month)).reduce((s, p) => s + p.amount, 0);
    const owing = eff.filter((p) => p.status !== 'paid');
    const overdue = eff.filter((p) => p.status === 'overdue').sort((a, b) => a.due_date.localeCompare(b.due_date));
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return {
        label: d.toLocaleDateString('en-GB', { month: 'short' }),
        billed: eff.filter((p) => p.due_date.startsWith(key)).reduce((s, p) => s + p.amount, 0),
        collected: eff.filter((p) => p.status === 'paid' && (p.paid_date || p.due_date).startsWith(key)).reduce((s, p) => s + p.amount, 0),
      };
    });
    return {
      collected,
      owed: owing.reduce((s, p) => s + p.amount, 0),
      overdue,
      months,
      occupied: units.filter((u) => u.status === 'occupied').length,
      openRepairs: repairs.filter((r) => r.status === 'pending' || r.status === 'in_progress'),
      endingSoon: tenants.filter((t) => daysUntil(t.lease_end) <= 60 && daysUntil(t.lease_end) >= 0).length,
      notebook: totals(entries),
      upcomingPlans: entries.filter((e) => e.kind === 'plan' && !e.done).sort((a, b) => (a.target_date || '9999').localeCompare(b.target_date || '9999')).slice(0, 3),
    };
  }, [payments, units, repairs, tenants, entries]);

  if (loading) return <Spinner />;
  if (error)
    return (
      <Empty title="Could not load your data" action={<Button onClick={reload}>Try again</Button>}>
        {error}
      </Empty>
    );

  const active = properties.find((p) => p.id === propertyId) || properties[0];
  const activeUnits = active ? units.filter((u) => u.property_id === active.id) : [];
  const net = stats.collected - stats.notebook.spentMonth;
  const markPaid = (id: number) => run(() => api.updatePayment(id, { status: 'paid', paid_date: todayIso() }).then(reload), 'Payment recorded.');

  return (
    <>
      <PageHead title="Overview" sub={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })} />
      <GettingStarted />

      <dl className="mb-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl bg-pine p-5 text-white shadow-sm">
          <dt className="text-sm text-white/75">Collected this month</dt>
          <dd className="tabular mt-1 font-display text-2xl font-bold">{money(stats.collected)}</dd>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
          <dt className="text-sm text-muted">Still owed</dt>
          <dd className="tabular mt-1 font-display text-2xl font-bold">{money(stats.owed)}</dd>
        </div>
        <div className="rounded-2xl bg-ochre-tint p-5 shadow-sm">
          <dt className="text-sm text-ochre-ink">Spent this month</dt>
          <dd className="tabular mt-1 font-display text-2xl font-bold text-ochre-ink">{money(stats.notebook.spentMonth)}</dd>
        </div>
        <div className="rounded-2xl bg-ink p-5 text-white shadow-sm">
          <dt className="text-sm text-white/70">Left after expenses</dt>
          <dd className={`tabular mt-1 font-display text-2xl font-bold ${net < 0 ? 'text-brick-tint' : ''}`}>{money(net)}</dd>
        </div>
      </dl>

      {properties.length === 0 ? (
        <Empty
          title="Your units will appear here"
          action={
            <Link to="/admin/properties" className="rounded-lg bg-pine px-4 py-2.5 text-sm font-medium text-white">
              Add a property
            </Link>
          }
        >
          Once you add a building and its units, you will see every unit with its photo here.
        </Empty>
      ) : (
        <div className="grid gap-10 lg:grid-cols-[1.3fr_1fr]">
          <section>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-bold">
                {active.name} <span className="text-base font-normal text-muted">{stats.occupied} of {units.length} units occupied</span>
              </h2>
              {properties.length > 1 && (
                <select aria-label="Choose property" value={active.id} onChange={(e) => setPropertyId(Number(e.target.value))} className="rounded-lg border border-line bg-white px-3 py-2 text-sm">
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {activeUnits.length === 0 ? (
              <Empty title="No units yet">Add units to this property on the Properties page.</Empty>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {activeUnits.map((u) => (
                  <Link key={u.id} to="/admin/properties" aria-label={`Open unit ${u.unit_number}`}>
                    <UnitTile unit={u} tone={unitTone(u, payments)} />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="space-y-8">
            <div>
              <h2 className="mb-4 text-xl font-bold">Needs attention</h2>
              {stats.overdue.length === 0 && stats.openRepairs.length === 0 ? (
                <Empty title="Nothing is late">No overdue rent and no open repairs.</Empty>
              ) : (
                <ul className="divide-y divide-line rounded-2xl border border-line bg-white shadow-sm">
                  {stats.overdue.slice(0, 4).map((p) => (
                    <li key={`p${p.id}`} className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {p.tenant_name} <span className="font-normal text-muted">in {p.unit_number}</span>
                        </p>
                        <p className="tabular text-sm text-brick">
                          {money(p.amount)} was due {shortDate(p.due_date)}
                        </p>
                      </div>
                      <Button variant="quiet" busy={busy} onClick={() => markPaid(p.id)}>
                        Mark paid
                      </Button>
                    </li>
                  ))}
                  {stats.openRepairs.slice(0, 4).map((r) => (
                    <li key={`r${r.id}`} className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{r.title}</p>
                        <p className="text-sm text-muted">
                          Unit {r.unit_number}, {shortDate(r.created_at)}
                        </p>
                      </div>
                      <Pill tone={r.priority === 'urgent' || r.priority === 'high' ? 'brick' : 'ochre'}>{r.priority}</Pill>
                    </li>
                  ))}
                </ul>
              )}
              {stats.endingSoon > 0 && (
                <p className="mt-3 text-sm text-muted">
                  {stats.endingSoon} lease{stats.endingSoon > 1 ? 's end' : ' ends'} within 60 days.{' '}
                  <Link to="/admin/tenants" className="font-medium text-pine underline">
                    Review tenants
                  </Link>
                </p>
              )}
            </div>

            <div>
              <h2 className="mb-4 text-xl font-bold">Your plans</h2>
              {stats.upcomingPlans.length === 0 ? (
                <Empty title="No plans yet" action={<Link to="/admin/notebook" className="rounded-lg bg-pine px-4 py-2.5 text-sm font-medium text-white">Open notebook</Link>}>
                  Write down what you want to do with a unit and what it will cost.
                </Empty>
              ) : (
                <ul className="divide-y divide-line rounded-2xl border border-line bg-white shadow-sm">
                  {stats.upcomingPlans.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="truncate font-medium">{e.title}</p>
                        <p className="text-sm text-muted">{e.target_date ? `Target ${shortDate(e.target_date)}` : 'No target date'}</p>
                      </div>
                      {e.amount != null && <p className="tabular text-sm font-semibold">{money(e.amount)}</p>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}

      <section className="mt-12">
        <h2 className="mb-1 text-xl font-bold">Rent over six months</h2>
        <p className="mb-4 flex gap-5 text-sm text-muted">
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm bg-line" />
            Billed
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-sm bg-pine" />
            Collected
          </span>
        </p>
        <div className="max-w-2xl rounded-2xl border border-line bg-white p-5 shadow-sm">
          <Bars data={stats.months} />
        </div>
      </section>
    </>
  );
}
