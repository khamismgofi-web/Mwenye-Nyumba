import { useMemo, useState } from 'react';
import { Elevation, ElevationLegend } from '../../components/Elevation';
import { Empty, PageHead, Pill, Spinner, useAction } from '../../components/ui';
import { Button } from '../../components/ui';
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
      <line x1="0" x2="480" y1="136" y2="136" stroke="#1b2430" strokeWidth="1.5" />
      {data.map((d, i) => {
        const x = 12 + i * 78;
        const hb = (d.billed / max) * 120;
        const hc = (d.collected / max) * 120;
        return (
          <g key={d.label}>
            <rect x={x} y={136 - hb} width="26" height={hb} fill="#dde2e6">
              <title>{`Billed ${money(d.billed)}`}</title>
            </rect>
            <rect x={x + 30} y={136 - hc} width="26" height={hc} fill="#0f5c4e">
              <title>{`Collected ${money(d.collected)}`}</title>
            </rect>
            <text x={x + 28} y="156" textAnchor="middle" fontSize="12" fill="#5b6675">
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function Overview() {
  const { properties, units, tenants, payments, repairs, loading, error, reload } = useData();
  const [propertyId, setPropertyId] = useState<number | null>(null);
  const { busy, run } = useAction();

  const stats = useMemo(() => {
    const month = todayIso().slice(0, 7);
    const eff = payments.map((p) => ({ ...p, status: effectiveStatus(p) }));
    const collected = eff
      .filter((p) => p.status === 'paid' && (p.paid_date || p.due_date).startsWith(month))
      .reduce((s, p) => s + p.amount, 0);
    const owing = eff.filter((p) => p.status !== 'paid');
    const overdue = eff.filter((p) => p.status === 'overdue').sort((a, b) => a.due_date.localeCompare(b.due_date));
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return {
        label: d.toLocaleDateString('en-GB', { month: 'short' }),
        billed: eff.filter((p) => p.due_date.startsWith(key)).reduce((s, p) => s + p.amount, 0),
        collected: eff
          .filter((p) => p.status === 'paid' && (p.paid_date || p.due_date).startsWith(key))
          .reduce((s, p) => s + p.amount, 0),
      };
    });
    return {
      collected,
      owed: owing.reduce((s, p) => s + p.amount, 0),
      overdue,
      overdueTotal: overdue.reduce((s, p) => s + p.amount, 0),
      months,
      occupied: units.filter((u) => u.status === 'occupied').length,
      openRepairs: repairs.filter((r) => r.status === 'pending' || r.status === 'in_progress'),
      endingSoon: tenants.filter((t) => daysUntil(t.lease_end) <= 60 && daysUntil(t.lease_end) >= 0).length,
    };
  }, [payments, units, repairs, tenants]);

  if (loading) return <Spinner />;
  if (error)
    return (
      <Empty title="Could not load your data" action={<Button onClick={reload}>Try again</Button>}>
        {error}
      </Empty>
    );
  if (properties.length === 0)
    return (
      <>
        <PageHead title="Overview" />
        <Empty
          title="Add your first property"
          action={
            <Link to="/admin/properties" className="rounded-md bg-pine px-4 py-2.5 text-sm font-medium text-white">
              Add a property
            </Link>
          }
        >
          Once you add a building and its units, you will see who has paid and what needs fixing here.
        </Empty>
      </>
    );

  const active = properties.find((p) => p.id === propertyId) || properties[0];
  const activeUnits = units.filter((u) => u.property_id === active.id);

  const markPaid = (id: number) =>
    run(() => api.updatePayment(id, { status: 'paid', paid_date: todayIso() }).then(reload), 'Payment recorded.');

  return (
    <>
      <PageHead
        title="Overview"
        sub={new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}
      />

      <dl className="mb-10 grid grid-cols-2 divide-line rounded-lg border border-line bg-white md:grid-cols-4 md:divide-x">
        {[
          ['Collected this month', money(stats.collected), 'text-pine'],
          ['Still owed', money(stats.owed), 'text-ink'],
          ['Occupied units', `${stats.occupied} of ${units.length}`, 'text-ink'],
          ['Open repairs', String(stats.openRepairs.length), stats.openRepairs.length ? 'text-ochre-ink' : 'text-ink'],
        ].map(([label, value, color]) => (
          <div key={label} className="border-b border-line p-5 md:border-b-0">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className={`tabular mt-1 font-display text-2xl font-bold ${color}`}>{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-bold">{active.name}</h2>
            {properties.length > 1 && (
              <select
                aria-label="Choose property"
                value={active.id}
                onChange={(e) => setPropertyId(Number(e.target.value))}
                className="rounded-md border border-line bg-white px-3 py-2 text-sm"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          {activeUnits.length === 0 ? (
            <Empty title="No units yet">Add units to this property to see the building here.</Empty>
          ) : (
            <div className="rounded-lg border border-line bg-white py-6">
              <Elevation
                units={activeUnits.map((u) => ({
                  id: u.id,
                  label: u.unit_number,
                  floor: u.floor ?? 0,
                  tone: unitTone(u, payments),
                }))}
              />
              <div className="mt-5">
                <ElevationLegend />
              </div>
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-xl font-bold">Needs attention</h2>
          {stats.overdue.length === 0 && stats.openRepairs.length === 0 ? (
            <Empty title="Nothing is late">No overdue rent and no open repairs.</Empty>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line bg-white">
              {stats.overdue.slice(0, 5).map((p) => (
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
                      Unit {r.unit_number}, reported {shortDate(r.created_at)}
                    </p>
                  </div>
                  <Pill tone={r.priority === 'urgent' || r.priority === 'high' ? 'brick' : 'ochre'}>{r.priority}</Pill>
                </li>
              ))}
            </ul>
          )}
          {stats.overdue.length > 5 && (
            <Link to="/admin/rent" className="mt-3 inline-block text-sm font-medium text-pine underline">
              See all {stats.overdue.length} overdue payments ({money(stats.overdueTotal)})
            </Link>
          )}
          {stats.endingSoon > 0 && (
            <p className="mt-4 text-sm text-muted">
              {stats.endingSoon} lease{stats.endingSoon > 1 ? 's end' : ' ends'} within 60 days.{' '}
              <Link to="/admin/tenants" className="font-medium text-pine underline">
                Review tenants
              </Link>
            </p>
          )}
        </section>
      </div>

      <section className="mt-12">
        <h2 className="mb-1 text-xl font-bold">Rent over six months</h2>
        <p className="mb-4 flex gap-5 text-sm text-muted">
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 bg-line" />
            Billed
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 bg-pine" />
            Collected
          </span>
        </p>
        <div className="max-w-2xl rounded-lg border border-line bg-white p-5">
          <Bars data={stats.months} />
        </div>
      </section>
    </>
  );
}
