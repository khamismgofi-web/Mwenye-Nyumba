import type React from 'react';
import { FormEvent, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button, Empty, Field, Modal, PageHead, Pill, Spinner, inputCls, useAction, useToast } from '../../components/ui';
import { api } from '../../lib/api';
import { addYears, copyText, daysUntil, money, randomPassword, shortDate, todayIso } from '../../lib/format';
import { useData } from './data';

function AddTenant({ onClose }: { onClose: () => void }) {
  const { units, reload } = useData();
  const { busy, run } = useAction();
  const vacant = units.filter((u) => u.status === 'vacant');
  const [f, setF] = useState({
    unit_id: String(vacant[0]?.id ?? ''),
    name: '',
    contact_info: '',
    email: '',
    password: randomPassword(),
    lease_start: todayIso(),
    lease_end: addYears(todayIso(), 1),
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await run(() => api.createTenant({ ...f, unit_id: Number(f.unit_id) }).then(reload), 'Tenant added.');
    if (ok) onClose();
  };

  return (
    <Modal title="Add a tenant directly" onClose={onClose} wide>
      {vacant.length === 0 ? (
        <p className="text-muted">There are no vacant units. Add a unit or free one up first.</p>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <p className="text-sm text-muted">
            Prefer to let the tenant set their own password? Close this and send an invite code from the Properties page.
          </p>
          <Field label="Unit">
            <select className={inputCls} value={f.unit_id} onChange={set('unit_id')} required>
              {vacant.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.property_name}, unit {u.unit_number} ({money(u.rent_amount)})
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name">
              <input className={inputCls} value={f.name} onChange={set('name')} required autoFocus />
            </Field>
            <Field label="Phone number">
              <input className={inputCls} type="tel" value={f.contact_info} onChange={set('contact_info')} required minLength={5} />
            </Field>
            <Field label="Email">
              <input className={inputCls} type="email" value={f.email} onChange={set('email')} required />
            </Field>
            <Field label="Starting password" hint="Share it with the tenant. They sign in with their email.">
              <input className={inputCls} value={f.password} onChange={set('password')} required minLength={8} maxLength={72} />
            </Field>
            <Field label="Lease starts">
              <input className={inputCls} type="date" value={f.lease_start} onChange={set('lease_start')} required />
            </Field>
            <Field label="Lease ends">
              <input className={inputCls} type="date" value={f.lease_end} min={f.lease_start} onChange={set('lease_end')} required />
            </Field>
          </div>
          <Button type="submit" busy={busy} className="w-full">
            Add tenant
          </Button>
        </form>
      )}
    </Modal>
  );
}

export default function Tenants() {
  const { tenants, invites, units, loading, error, reload } = useData();
  const { busy, run } = useAction();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tenants.filter((t) => !q || `${t.name} ${t.unit_number} ${t.property_name} ${t.contact_info}`.toLowerCase().includes(q));
  }, [tenants, query]);
  const pending = invites.filter((i) => !i.used && new Date(i.expires_at) > new Date());

  if (loading) return <Spinner />;
  if (error) return <Empty title="Could not load your data" action={<Button onClick={reload}>Try again</Button>}>{error}</Empty>;

  const remove = async (id: number, name: string) => {
    if (!window.confirm(`Remove ${name}? Their rent and repair history is deleted too, and the unit becomes vacant.`)) return;
    await run(() => api.deleteTenant(id).then(reload), `${name} removed.`);
  };

  const copyLink = async (code: string) => {
    const ok = await copyText(`${window.location.origin}/#/register?code=${code}`);
    toast(ok ? 'Invite link copied.' : 'Copy failed. Select the code and share it by hand.', ok ? 'ok' : 'error');
  };

  return (
    <>
      <PageHead
        title="Tenants"
        sub={`${tenants.length} ${tenants.length === 1 ? 'tenant' : 'tenants'} across ${new Set(tenants.map((t) => t.property_id)).size} properties`}
        action={
          <Button onClick={() => setAdding(true)}>
            <Plus size={16} />
            Add tenant
          </Button>
        }
      />

      {pending.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-xl font-bold">Waiting to register</h2>
          <ul className="divide-y divide-line rounded-lg border border-line bg-white">
            {pending.map((i) => {
              const unit = units.find((u) => u.id === i.unit_id);
              return (
                <li key={i.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">
                      Unit {unit?.unit_number} <span className="font-normal text-muted">at {unit?.property_name}</span>
                    </p>
                    <p className="text-sm text-muted">
                      Code <span className="font-medium tracking-wider text-ink">{i.code}</span>, expires {shortDate(i.expires_at)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="quiet" onClick={() => copyLink(i.code)}>
                      Copy link
                    </Button>
                    <Button variant="danger" busy={busy} onClick={() => run(() => api.revokeInvite(i.id).then(reload), 'Invite code revoked.')}>
                      Revoke
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {tenants.length === 0 ? (
        <Empty title="No tenants yet">Create an invite code for a vacant unit from the Properties page, or add a tenant directly.</Empty>
      ) : (
        <>
          <input
            className={`${inputCls} mb-4 max-w-sm`}
            type="search"
            placeholder="Search by name, unit or phone"
            aria-label="Search tenants"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="overflow-x-auto rounded-lg border border-line bg-white">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-line text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Tenant</th>
                  <th className="px-4 py-3 font-medium">Unit</th>
                  <th className="px-4 py-3 font-medium">Lease ends</th>
                  <th className="px-4 py-3 text-right font-medium">Balance due</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((t) => {
                  const days = daysUntil(t.lease_end);
                  return (
                    <tr key={t.id}>
                      <td className="px-4 py-3">
                        <p className="font-medium">{t.name}</p>
                        <p className="text-muted">{t.contact_info}</p>
                      </td>
                      <td className="px-4 py-3">
                        {t.unit_number}
                        <p className="text-muted">{t.property_name}</p>
                      </td>
                      <td className="px-4 py-3">
                        {shortDate(t.lease_end)}
                        {days < 0 ? (
                          <span className="ml-2"><Pill tone="brick">Ended</Pill></span>
                        ) : days <= 60 ? (
                          <span className="ml-2"><Pill tone="ochre">{days} days left</Pill></span>
                        ) : null}
                      </td>
                      <td className={`tabular px-4 py-3 text-right font-medium ${t.balance_due ? 'text-brick' : 'text-muted'}`}>
                        {money(t.balance_due)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" onClick={() => remove(t.id, t.name)}>
                          Remove
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && <p className="mt-4 text-sm text-muted">No tenant matches that search.</p>}
        </>
      )}

      {adding && <AddTenant onClose={() => setAdding(false)} />}
    </>
  );
}
