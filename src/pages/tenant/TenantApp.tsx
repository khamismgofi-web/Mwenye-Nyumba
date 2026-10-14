import type React from 'react';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { Home, Plus, Wallet, Wrench } from 'lucide-react';
import { Shell, NavItem } from '../../components/Shell';
import { Button, Empty, Field, Modal, PageHead, Pill, Spinner, inputCls, useAction } from '../../components/ui';
import { effectiveStatus } from '../../lib/derive';
import { api } from '../../lib/api';
import { daysUntil, methodLabel, money, shortDate, toDate, todayIso } from '../../lib/format';
import { Link } from '../../lib/router';
import type { Payment, Repair, Tenant, Unit } from '../../types';
import { priorityTone, statusLabel } from '../admin/Repairs';

const items: NavItem[] = [
  { key: 'home', label: 'My home', to: '/home', icon: <Home size={18} /> },
  { key: 'rent', label: 'Rent', to: '/rent', icon: <Wallet size={18} /> },
  { key: 'repairs', label: 'Repairs', to: '/repairs', icon: <Wrench size={18} /> },
];

interface Data {
  tenant: Tenant;
  unit: Unit | null;
  payments: Payment[];
  repairs: Repair[];
}

function ReportRepair({ onClose, onDone }: { onClose: () => void; onDone: () => Promise<void> }) {
  const { busy, run } = useAction();
  const [f, setF] = useState({ title: '', category: 'Plumbing', priority: 'medium', description: '' });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await run(() => api.createRepair(f).then(onDone), 'Repair reported. Your landlord has been notified.');
    if (ok) onClose();
  };
  return (
    <Modal title="Report a problem" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="What is wrong?">
          <input className={inputCls} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required autoFocus placeholder="For example: Kitchen tap is leaking" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Type">
            <select className={inputCls} value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>
              {['Plumbing', 'Electrical', 'Appliance', 'Structural', 'Security', 'General'].map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="How urgent?">
            <select className={inputCls} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value })}>
              <option value="low">Can wait</option>
              <option value="medium">Soon</option>
              <option value="high">Important</option>
              <option value="urgent">Emergency</option>
            </select>
          </Field>
        </div>
        <Field label="Details" hint="Say where it is and what you have seen.">
          <textarea className={inputCls} rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} required minLength={5} />
        </Field>
        <Button type="submit" busy={busy} className="w-full">
          Send report
        </Button>
      </form>
    </Modal>
  );
}

export default function TenantApp({ path }: { path: string }) {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  const [reporting, setReporting] = useState(false);
  const tab = ['home', 'rent', 'repairs'].includes(path.slice(1)) ? path.slice(1) : 'home';

  const load = useCallback(async () => {
    try {
      const [tenant, units, payments, repairs] = await Promise.all([api.myTenant(), api.units(), api.payments(), api.repairs()]);
      setData({ tenant, unit: units[0] || null, payments, repairs });
      setError('');
    } catch (e: any) {
      setError(e.message || 'Could not load your account');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  let body: React.ReactNode;
  if (error) body = <Empty title="Could not load your account" action={<Button onClick={load}>Try again</Button>}>{error}</Empty>;
  else if (!data) body = <Spinner />;
  else {
    const { tenant, unit, payments, repairs } = data;
    const eff = payments.map((p) => ({ ...p, shown: effectiveStatus(p) })).sort((a, b) => b.due_date.localeCompare(a.due_date));
    const owing = eff.filter((p) => p.shown !== 'paid').sort((a, b) => a.due_date.localeCompare(b.due_date));
    const owed = owing.reduce((s, p) => s + p.amount, 0);
    const late = owing.filter((p) => p.shown === 'overdue');
    const total = toDate(tenant.lease_end).getTime() - toDate(tenant.lease_start).getTime();
    const used = Date.now() - toDate(tenant.lease_start).getTime();
    const pct = Math.max(0, Math.min(100, Math.round((used / Math.max(total, 1)) * 100)));
    const left = daysUntil(tenant.lease_end);

    if (tab === 'home') {
      body = (
        <>
          <PageHead title={`Hello, ${tenant.name.split(' ')[0]}`} sub={`${tenant.property_name}, unit ${tenant.unit_number}`} />
          <div className="grid gap-6 md:grid-cols-2">
            <section className="rounded-lg border border-line bg-white p-6">
              <p className="text-sm text-muted">{owed > 0 ? 'You owe' : 'Rent status'}</p>
              <p className={`tabular font-display text-4xl font-bold ${late.length ? 'text-brick' : owed > 0 ? 'text-ink' : 'text-pine'}`}>
                {owed > 0 ? money(owed) : 'Paid up'}
              </p>
              {owing[0] ? (
                <p className="mt-2 text-sm text-muted">
                  {late.length
                    ? `${late.length} overdue, the oldest was due ${shortDate(late[0].due_date)}.`
                    : `Next payment of ${money(owing[0].amount)} is due ${shortDate(owing[0].due_date)}.`}
                </p>
              ) : (
                <p className="mt-2 text-sm text-muted">You have no payments waiting. Monthly rent is {money(unit?.rent_amount ?? tenant.rent_amount)}.</p>
              )}
              <Link to="/rent" className="mt-4 inline-block text-sm font-medium text-pine underline">
                See payment history
              </Link>
            </section>

            <section className="rounded-lg border border-line bg-white p-6">
              <p className="text-sm text-muted">Your lease</p>
              <p className="font-display text-2xl font-bold">
                {left < 0 ? 'Lease has ended' : left === 0 ? 'Ends today' : `${left} days left`}
              </p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-line" role="img" aria-label={`${pct} percent of the lease has passed`}>
                <div className="h-full bg-pine" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-2 text-sm text-muted">
                {shortDate(tenant.lease_start)} to {shortDate(tenant.lease_end)}
              </p>
            </section>

            <section className="rounded-lg border border-line bg-white p-6 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold">Repairs</h2>
                <Button variant="quiet" onClick={() => setReporting(true)}>
                  <Plus size={16} />
                  Report a problem
                </Button>
              </div>
              {repairs.filter((r) => r.status === 'pending' || r.status === 'in_progress').length === 0 ? (
                <p className="mt-3 text-sm text-muted">Nothing open. If something breaks, report it here.</p>
              ) : (
                <ul className="mt-3 divide-y divide-line">
                  {repairs
                    .filter((r) => r.status === 'pending' || r.status === 'in_progress')
                    .map((r) => (
                      <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                        <span className="font-medium">{r.title}</span>
                        <Pill tone={r.status === 'in_progress' ? 'pine' : 'ochre'}>{statusLabel[r.status]}</Pill>
                      </li>
                    ))}
                </ul>
              )}
            </section>
          </div>
        </>
      );
    } else if (tab === 'rent') {
      body = (
        <>
          <PageHead title="Rent" sub={`Monthly rent is ${money(unit?.rent_amount ?? tenant.rent_amount)}. Your landlord records each payment after receiving it.`} />
          {eff.length === 0 ? (
            <Empty title="No payments yet">Charges and payments will appear here.</Empty>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-line bg-white">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="border-b border-line text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Due</th>
                    <th className="px-4 py-3 text-right font-medium">Amount</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {eff.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3">{shortDate(p.due_date)}</td>
                      <td className="tabular px-4 py-3 text-right font-medium">{money(p.amount)}</td>
                      <td className="px-4 py-3">
                        {p.shown === 'paid' ? <Pill tone="pine">Paid</Pill> : p.shown === 'overdue' ? <Pill tone="brick">Overdue</Pill> : <Pill>Upcoming</Pill>}
                        {p.shown === 'paid' && (
                          <p className="mt-1 text-xs text-muted">
                            {shortDate(p.paid_date)}
                            {p.payment_method && `, ${methodLabel[p.payment_method]}`}
                          </p>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      );
    } else {
      body = (
        <>
          <PageHead
            title="Repairs"
            sub="Tell your landlord when something needs fixing."
            action={
              <Button onClick={() => setReporting(true)}>
                <Plus size={16} />
                Report a problem
              </Button>
            }
          />
          {repairs.length === 0 ? (
            <Empty title="No repair requests">Anything you report will be listed here with its progress.</Empty>
          ) : (
            <ul className="space-y-3">
              {[...repairs]
                .sort((a, b) => b.created_at.localeCompare(a.created_at))
                .map((r) => (
                  <li key={r.id} className="rounded-lg border border-line bg-white p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-medium">{r.title}</p>
                      <div className="flex gap-2">
                        <Pill tone={priorityTone[r.priority]}>{r.priority}</Pill>
                        <Pill tone={r.status === 'completed' ? 'pine' : r.status === 'in_progress' ? 'ochre' : 'neutral'}>{statusLabel[r.status]}</Pill>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-muted">{r.description}</p>
                    {r.admin_notes && (
                      <p className="mt-3 rounded-md bg-plaster p-3 text-sm">
                        <span className="font-medium">Landlord: </span>
                        {r.admin_notes}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-muted">Reported {shortDate(r.created_at)}</p>
                  </li>
                ))}
            </ul>
          )}
        </>
      );
    }
  }

  return (
    <Shell items={items} current={tab}>
      {body}
      {reporting && <ReportRepair onClose={() => setReporting(false)} onDone={load} />}
    </Shell>
  );
}
