import type React from 'react';
import { FormEvent, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Empty, Field, Modal, PageHead, Pill, Spinner, inputCls, useAction } from '../../components/ui';
import { effectiveStatus } from '../../lib/derive';
import { api } from '../../lib/api';
import { methodLabel, money, shortDate, todayIso } from '../../lib/format';
import type { Payment } from '../../types';
import { useData } from './data';

const filters = [
  ['all', 'All'],
  ['overdue', 'Overdue'],
  ['pending', 'Upcoming'],
  ['paid', 'Paid'],
] as const;

function RecordPayment({ payment, onClose }: { payment: Payment; onClose: () => void }) {
  const { reload } = useData();
  const { busy, run } = useAction();
  const [f, setF] = useState({ paid_date: todayIso(), payment_method: 'mpesa', reference_code: '' });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await run(
      () =>
        api
          .updatePayment(payment.id, {
            status: 'paid',
            paid_date: f.paid_date,
            payment_method: f.payment_method as Payment['payment_method'],
            reference_code: f.reference_code || null,
          })
          .then(reload),
      'Payment recorded.',
    );
    if (ok) onClose();
  };
  return (
    <Modal title="Record payment" onClose={onClose}>
      <p className="mb-5 text-sm text-muted">
        {payment.tenant_name}, unit {payment.unit_number}: <span className="tabular font-medium text-ink">{money(payment.amount)}</span> due {shortDate(payment.due_date)}
      </p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Date received">
          <input className={inputCls} type="date" value={f.paid_date} max={todayIso()} onChange={set('paid_date')} required />
        </Field>
        <Field label="Paid by">
          <select className={inputCls} value={f.payment_method} onChange={set('payment_method')}>
            {Object.entries(methodLabel).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reference (optional)" hint="For example the M-Pesa transaction code.">
          <input className={inputCls} value={f.reference_code} onChange={set('reference_code')} />
        </Field>
        <Button type="submit" busy={busy} className="w-full">
          Record payment
        </Button>
      </form>
    </Modal>
  );
}

function AddCharge({ onClose }: { onClose: () => void }) {
  const { tenants, reload } = useData();
  const { busy, run } = useAction();
  const first = tenants[0];
  const [f, setF] = useState({
    tenant_id: String(first?.id ?? ''),
    amount: String(first?.rent_amount ?? ''),
    due_date: todayIso(),
    notes: '',
  });
  const pick = (id: string) => {
    const t = tenants.find((x) => x.id === Number(id));
    setF({ ...f, tenant_id: id, amount: String(t?.rent_amount ?? f.amount) });
  };
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await run(
      () =>
        api
          .createPayment({ tenant_id: Number(f.tenant_id), amount: Number(f.amount), due_date: f.due_date, status: 'pending', notes: f.notes || null })
          .then(reload),
      'Charge added.',
    );
    if (ok) onClose();
  };
  return (
    <Modal title="Add a rent charge" onClose={onClose}>
      {tenants.length === 0 ? (
        <p className="text-muted">Add a tenant first, then you can bill them.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Field label="Tenant">
            <select className={inputCls} value={f.tenant_id} onChange={(e) => pick(e.target.value)} required>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}, unit {t.unit_number}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Amount">
              <input className={inputCls} type="number" min={1} step="any" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} required />
            </Field>
            <Field label="Due date">
              <input className={inputCls} type="date" value={f.due_date} onChange={(e) => setF({ ...f, due_date: e.target.value })} required />
            </Field>
          </div>
          <Field label="Note (optional)">
            <input className={inputCls} value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} placeholder="For example: October rent" />
          </Field>
          <Button type="submit" busy={busy} className="w-full">
            Add charge
          </Button>
        </form>
      )}
    </Modal>
  );
}

export default function Rent() {
  const { payments, loading, error, reload } = useData();
  const [filter, setFilter] = useState<(typeof filters)[number][0]>('all');
  const [recording, setRecording] = useState<Payment | null>(null);
  const [adding, setAdding] = useState(false);

  const rows = useMemo(
    () =>
      payments
        .map((p) => ({ ...p, shown: effectiveStatus(p) }))
        .filter((p) => filter === 'all' || p.shown === filter)
        .sort((a, b) => b.due_date.localeCompare(a.due_date)),
    [payments, filter],
  );
  const total = rows.reduce((s, p) => s + p.amount, 0);

  if (loading) return <Spinner />;
  if (error) return <Empty title="Could not load your data" action={<Button onClick={reload}>Try again</Button>}>{error}</Empty>;

  return (
    <>
      <PageHead
        title="Rent"
        sub="Rent is overdue once its due date has passed."
        action={
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} />
            Add charge
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Filter rent" className="flex gap-1 rounded-lg border border-line bg-white p-1">
          {filters.map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={filter === key}
              onClick={() => setFilter(key)}
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium ${filter === key ? 'bg-pine text-white' : 'text-muted hover:text-ink'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="tabular text-sm text-muted">
          {rows.length} {rows.length === 1 ? 'payment' : 'payments'}, <span className="font-medium text-ink">{money(total)}</span>
        </p>
      </div>

      {rows.length === 0 ? (
        <Empty title="Nothing to show">{filter === 'all' ? 'Add a rent charge to start tracking payments.' : 'No payments match this filter.'}</Empty>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Tenant</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.tenant_name}</p>
                    <p className="text-muted">Unit {p.unit_number}, {p.property_name}</p>
                  </td>
                  <td className="px-4 py-3">{shortDate(p.due_date)}</td>
                  <td className="tabular px-4 py-3 text-right font-medium">{money(p.amount)}</td>
                  <td className="px-4 py-3">
                    {p.shown === 'paid' ? (
                      <>
                        <Pill tone="pine">Paid</Pill>
                        <p className="mt-1 text-xs text-muted">
                          {shortDate(p.paid_date)}
                          {p.payment_method && `, ${methodLabel[p.payment_method]}`}
                          {p.reference_code && `, ${p.reference_code}`}
                        </p>
                      </>
                    ) : p.shown === 'overdue' ? (
                      <Pill tone="brick">Overdue</Pill>
                    ) : (
                      <Pill tone="neutral">Upcoming</Pill>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {p.shown !== 'paid' && (
                      <Button variant="quiet" onClick={() => setRecording(p)}>
                        Record payment
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {recording && <RecordPayment payment={recording} onClose={() => setRecording(null)} />}
      {adding && <AddCharge onClose={() => setAdding(false)} />}
    </>
  );
}
