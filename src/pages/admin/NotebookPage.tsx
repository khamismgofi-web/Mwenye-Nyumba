import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { EntryModal, EntryRow, totals } from '../../components/Notebook';
import { Button, Empty, PageHead, Spinner } from '../../components/ui';
import { money } from '../../lib/format';
import type { EntryKind } from '../../types';
import { useData } from './data';

const filters: ['all' | EntryKind, string][] = [
  ['all', 'Everything'],
  ['plan', 'Plans'],
  ['expense', 'Expenses'],
  ['note', 'Notes'],
];

export default function NotebookPage() {
  const { properties, units, entries, loading, error, reload } = useData();
  const [filter, setFilter] = useState<'all' | EntryKind>('all');
  const [propertyId, setPropertyId] = useState<number | 'all'>('all');
  const [adding, setAdding] = useState(false);

  const shown = useMemo(
    () =>
      entries.filter((e) => (filter === 'all' || e.kind === filter) && (propertyId === 'all' || e.property_id === propertyId)),
    [entries, filter, propertyId],
  );
  const sums = totals(entries.filter((e) => propertyId === 'all' || e.property_id === propertyId));

  const groups = useMemo(() => {
    const map = new Map<string, typeof shown>();
    shown.forEach((e) => {
      const unit = units.find((u) => u.id === e.unit_id);
      const prop = properties.find((p) => p.id === e.property_id);
      const key = unit ? `${prop?.name}, unit ${unit.unit_number}` : `${prop?.name}, whole property`;
      map.set(key, [...(map.get(key) || []), e]);
    });
    return [...map.entries()];
  }, [shown, units, properties]);

  if (loading) return <Spinner />;
  if (error) return <Empty title="Could not load your data" action={<Button onClick={reload}>Try again</Button>}>{error}</Empty>;

  return (
    <>
      <PageHead
        title="Notebook"
        sub="Plans, budgets and expenses for your units. This is the page that replaces your paper notebook."
        action={
          properties.length > 0 && (
            <Button onClick={() => setAdding(true)}>
              <Plus size={16} />
              Add entry
            </Button>
          )
        }
      />

      {properties.length === 0 ? (
        <Empty title="Add a property first">Your notes and budgets are kept against a property and its units.</Empty>
      ) : (
        <>
          <dl className="mb-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-ochre-tint p-5">
              <dt className="text-sm text-ochre-ink">Planned and not done yet</dt>
              <dd className="tabular mt-1 font-display text-2xl font-bold text-ochre-ink">{money(sums.plannedOpen)}</dd>
            </div>
            <div className="rounded-2xl bg-pine p-5 text-white">
              <dt className="text-sm text-white/75">Spent this month</dt>
              <dd className="tabular mt-1 font-display text-2xl font-bold">{money(sums.spentMonth)}</dd>
            </div>
            <div className="rounded-2xl border border-line bg-white p-5">
              <dt className="text-sm text-muted">Spent in total</dt>
              <dd className="tabular mt-1 font-display text-2xl font-bold">{money(sums.spent)}</dd>
            </div>
          </dl>

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div role="tablist" aria-label="Filter notebook" className="flex gap-1 rounded-xl border border-line bg-white p-1">
              {filters.map(([key, label]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={filter === key}
                  onClick={() => setFilter(key)}
                  className={`rounded-lg px-3.5 py-1.5 text-sm font-medium ${filter === key ? 'bg-pine text-white' : 'text-muted hover:text-ink'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            {properties.length > 1 && (
              <select
                aria-label="Filter by property"
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
              >
                <option value="all">All properties</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {groups.length === 0 ? (
            <Empty title="Nothing written yet" action={<Button onClick={() => setAdding(true)}>Add your first entry</Button>}>
              Try a plan like Repaint unit A3 with a budget, or an expense like Plumber, 25,000.
            </Empty>
          ) : (
            <div className="space-y-8">
              {groups.map(([name, list]) => (
                <section key={name}>
                  <h2 className="mb-2 text-lg font-bold">{name}</h2>
                  <ul className="divide-y divide-line rounded-2xl border border-line bg-white px-4 shadow-sm">
                    {list.map((e) => (
                      <EntryRow key={e.id} entry={e} reload={reload} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </>
      )}

      {adding && (
        <EntryModal
          kind="plan"
          properties={properties}
          units={units}
          propertyId={propertyId === 'all' ? undefined : propertyId}
          onClose={() => setAdding(false)}
          onSaved={reload}
        />
      )}
    </>
  );
}
