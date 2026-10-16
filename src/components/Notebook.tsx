import type React from 'react';
import { FormEvent, useState } from 'react';
import { Check, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { money, shortDate, todayIso } from '../lib/format';
import type { Entry, EntryKind } from '../types';
import { Button, Field, Modal, Pill, inputCls, useAction } from './ui';

export const kindLabel: Record<EntryKind, string> = { note: 'Note', plan: 'Plan', expense: 'Expense' };
export const categories = ['Repairs', 'Paint and finishing', 'Utilities', 'Taxes and licences', 'Cleaning', 'Security', 'Furniture', 'Other'];

export function EntryModal({
  kind,
  propertyId,
  unitId,
  properties,
  units,
  onClose,
  onSaved,
}: {
  kind: EntryKind;
  propertyId?: number;
  unitId?: number | null;
  properties?: { id: number; name: string }[];
  units?: { id: number; property_id: number; unit_number: string }[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const { busy, run } = useAction();
  const [f, setF] = useState({
    kind,
    property_id: String(propertyId ?? properties?.[0]?.id ?? ''),
    unit_id: unitId ? String(unitId) : '',
    title: '',
    body: '',
    amount: '',
    category: 'Repairs',
    entry_date: todayIso(),
    target_date: '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });
  const unitChoices = (units || []).filter((u) => String(u.property_id) === f.property_id);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await run(
      () =>
        api
          .createEntry({
            property_id: Number(f.property_id),
            unit_id: f.unit_id ? Number(f.unit_id) : null,
            kind: f.kind,
            title: f.title,
            body: f.body || null,
            amount: f.amount === '' ? null : Number(f.amount),
            category: f.kind === 'expense' ? f.category : null,
            entry_date: f.entry_date,
            target_date: f.kind === 'plan' && f.target_date ? f.target_date : null,
          })
          .then(onSaved),
      `${kindLabel[f.kind]} saved.`,
    );
    if (ok) onClose();
  };

  return (
    <Modal title={`Add to notebook`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div role="radiogroup" aria-label="Type of entry" className="grid grid-cols-3 gap-1 rounded-lg bg-plaster p-1">
          {(['note', 'plan', 'expense'] as EntryKind[]).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={f.kind === k}
              onClick={() => setF({ ...f, kind: k })}
              className={`rounded-md px-3 py-2 text-sm font-medium ${f.kind === k ? 'bg-pine text-white' : 'text-muted'}`}
            >
              {kindLabel[k]}
            </button>
          ))}
        </div>

        {properties && (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Property">
              <select className={inputCls} value={f.property_id} onChange={(e) => setF({ ...f, property_id: e.target.value, unit_id: '' })} required>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Unit (optional)">
              <select className={inputCls} value={f.unit_id} onChange={set('unit_id')}>
                <option value="">Whole property</option>
                {unitChoices.map((u) => (
                  <option key={u.id} value={u.id}>
                    Unit {u.unit_number}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}

        <Field label={f.kind === 'plan' ? 'What do you plan to do?' : f.kind === 'expense' ? 'What was it for?' : 'Title'}>
          <input className={inputCls} value={f.title} onChange={set('title')} required maxLength={200} autoFocus />
        </Field>

        {f.kind !== 'note' && (
          <div className="grid grid-cols-2 gap-4">
            <Field label={f.kind === 'plan' ? 'Budget' : 'Amount spent'}>
              <input className={inputCls} type="number" min={0} step="any" value={f.amount} onChange={set('amount')} required={f.kind === 'expense'} />
            </Field>
            {f.kind === 'plan' ? (
              <Field label="Target date">
                <input className={inputCls} type="date" value={f.target_date} onChange={set('target_date')} />
              </Field>
            ) : (
              <Field label="Category">
                <select className={inputCls} value={f.category} onChange={set('category')}>
                  {categories.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
            )}
          </div>
        )}

        {f.kind !== 'plan' && (
          <Field label="Date">
            <input className={inputCls} type="date" value={f.entry_date} max={f.kind === 'expense' ? todayIso() : undefined} onChange={set('entry_date')} required />
          </Field>
        )}

        <Field label="Details (optional)">
          <textarea className={inputCls} rows={3} value={f.body} onChange={set('body')} maxLength={5000} />
        </Field>

        <Button type="submit" busy={busy} className="w-full">
          Save to notebook
        </Button>
      </form>
    </Modal>
  );
}

export function EntryRow({ entry, reload }: { entry: Entry; reload: () => Promise<void> }) {
  const { busy, run } = useAction();
  const toggle = () => run(() => api.updateEntry(entry.id, { done: !entry.done }).then(reload));
  const remove = async () => {
    if (!window.confirm('Delete this entry?')) return;
    await run(() => api.deleteEntry(entry.id).then(reload), 'Entry deleted.');
  };
  return (
    <li className="flex items-start gap-3 py-3">
      {entry.kind === 'plan' ? (
        <button
          type="button"
          disabled={busy}
          onClick={toggle}
          aria-label={entry.done ? 'Mark plan as not done' : 'Mark plan as done'}
          aria-pressed={entry.done}
          className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${entry.done ? 'border-pine bg-pine text-white' : 'border-line bg-white'}`}
        >
          {entry.done && <Check size={14} />}
        </button>
      ) : (
        <span className="mt-1">
          <Pill tone={entry.kind === 'expense' ? 'ochre' : 'neutral'}>{kindLabel[entry.kind]}</Pill>
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${entry.done ? 'text-muted line-through' : ''}`}>{entry.title}</p>
        {entry.body && <p className="mt-0.5 whitespace-pre-line text-sm text-muted">{entry.body}</p>}
        <p className="mt-1 text-xs text-muted">
          {entry.kind === 'plan' ? (entry.target_date ? `Target ${shortDate(entry.target_date)}` : 'No target date') : shortDate(entry.entry_date)}
          {entry.category && `, ${entry.category}`}
        </p>
      </div>
      {entry.amount != null && (
        <p className={`tabular shrink-0 text-sm font-semibold ${entry.kind === 'expense' ? 'text-ochre-ink' : ''}`}>{money(entry.amount)}</p>
      )}
      <button type="button" aria-label="Delete entry" onClick={remove} className="shrink-0 rounded p-1 text-muted hover:bg-brick-tint hover:text-brick">
        <Trash2 size={15} />
      </button>
    </li>
  );
}

export function totals(entries: Entry[]) {
  const month = todayIso().slice(0, 7);
  const plannedOpen = entries.filter((e) => e.kind === 'plan' && !e.done).reduce((s, e) => s + (e.amount || 0), 0);
  const spent = entries.filter((e) => e.kind === 'expense').reduce((s, e) => s + (e.amount || 0), 0);
  const spentMonth = entries
    .filter((e) => e.kind === 'expense' && e.entry_date.startsWith(month))
    .reduce((s, e) => s + (e.amount || 0), 0);
  return { plannedOpen, spent, spentMonth };
}
