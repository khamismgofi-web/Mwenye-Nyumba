import type React from 'react';
import { FormEvent, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { EntryModal, EntryRow, totals } from '../../components/Notebook';
import { PhotoCapture } from '../../components/PhotoCapture';
import { UnitTile } from '../../components/UnitTile';
import { Button, Empty, Field, Modal, PageHead, Pill, Spinner, inputCls, useAction, useToast } from '../../components/ui';
import { toneLabel, unitTone } from '../../lib/derive';
import { api } from '../../lib/api';
import { addYears, copyText, money, shortDate, todayIso } from '../../lib/format';
import { Link } from '../../lib/router';
import type { InviteCode, Property, Unit } from '../../types';
import { useData } from './data';

function PropertyForm({ property, onClose }: { property?: Property; onClose: () => void }) {
  const { reload } = useData();
  const { busy, run } = useAction();
  const [f, setF] = useState({
    name: property?.name || '',
    address: property?.address || '',
    owner: property?.owner || '',
    description: property?.description || '',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await run(
      () => (property ? api.updateProperty(property.id, f) : api.createProperty(f)).then(reload),
      property ? 'Property updated.' : 'Property added.',
    );
    if (ok) onClose();
  };
  return (
    <Modal title={property ? 'Edit property' : 'Add property'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Property name">
          <input className={inputCls} value={f.name} onChange={set('name')} required autoFocus />
        </Field>
        <Field label="Address">
          <input className={inputCls} value={f.address} onChange={set('address')} required />
        </Field>
        <Field label="Owner">
          <input className={inputCls} value={f.owner} onChange={set('owner')} required />
        </Field>
        <Field label="Notes (optional)">
          <textarea className={inputCls} rows={3} value={f.description} onChange={set('description')} />
        </Field>
        <Button type="submit" busy={busy} className="w-full">
          {property ? 'Save changes' : 'Add property'}
        </Button>
      </form>
    </Modal>
  );
}

function UnitForm({ propertyId, unit, onClose }: { propertyId: number; unit?: Unit; onClose: () => void }) {
  const { reload } = useData();
  const { busy, run } = useAction();
  const [f, setF] = useState({
    unit_number: unit?.unit_number || '',
    rent_amount: String(unit?.rent_amount ?? ''),
    floor: String(unit?.floor ?? 0),
    bedrooms: String(unit?.bedrooms ?? ''),
    bathrooms: String(unit?.bathrooms ?? ''),
    status: unit?.status || 'vacant',
  });
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });
  const num = (v: string) => (v === '' ? null : Number(v));
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const body = {
      unit_number: f.unit_number,
      rent_amount: Number(f.rent_amount),
      floor: num(f.floor),
      bedrooms: num(f.bedrooms),
      bathrooms: num(f.bathrooms),
      status: f.status,
    };
    const ok = await run(
      () =>
        (unit
          ? api.updateUnit(unit.id, body as Partial<Unit>)
          : api.createUnit({ ...body, property_id: propertyId })
        ).then(reload),
      unit ? 'Unit updated.' : 'Unit added.',
    );
    if (ok) onClose();
  };
  return (
    <Modal title={unit ? `Edit unit ${unit.unit_number}` : 'Add unit'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Unit number">
            <input className={inputCls} value={f.unit_number} onChange={set('unit_number')} required autoFocus />
          </Field>
          <Field label="Floor" hint="0 is the ground floor.">
            <input className={inputCls} type="number" min={0} value={f.floor} onChange={set('floor')} />
          </Field>
        </div>
        <Field label="Monthly rent">
          <input className={inputCls} type="number" min={1} step="any" value={f.rent_amount} onChange={set('rent_amount')} required />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bedrooms">
            <input className={inputCls} type="number" min={0} value={f.bedrooms} onChange={set('bedrooms')} />
          </Field>
          <Field label="Bathrooms">
            <input className={inputCls} type="number" min={0} value={f.bathrooms} onChange={set('bathrooms')} />
          </Field>
        </div>
        <Field label="Status">
          <select className={inputCls} value={f.status} onChange={set('status')} disabled={unit?.status === 'occupied'}>
            <option value="vacant">Vacant</option>
            <option value="maintenance">Under repair</option>
            {unit?.status === 'occupied' && <option value="occupied">Occupied</option>}
          </select>
        </Field>
        <Button type="submit" busy={busy} className="w-full">
          {unit ? 'Save changes' : 'Add unit'}
        </Button>
      </form>
    </Modal>
  );
}

function InviteModal({ unit, onClose }: { unit: Unit; onClose: () => void }) {
  const { reload } = useData();
  const toast = useToast();
  const { busy, run } = useAction();
  const [start, setStart] = useState(todayIso());
  const [end, setEnd] = useState(addYears(todayIso(), 1));
  const [invite, setInvite] = useState<InviteCode | null>(null);

  const create = async (e: FormEvent) => {
    e.preventDefault();
    await run(async () => {
      setInvite(await api.createInvite({ unit_id: unit.id, lease_start: start, lease_end: end }));
      await reload();
    });
  };

  const link = invite ? `${window.location.origin}/#/register?code=${invite.code}` : '';
  const message = invite
    ? `Hello. Please create your tenant account for unit ${unit.unit_number} at ${unit.property_name}: ${link} (code ${invite.code}, valid until ${shortDate(invite.expires_at)}).`
    : '';
  const copy = async (text: string, what: string) => toast((await copyText(text)) ? `${what} copied.` : 'Copy failed. Select the text and copy it by hand.', 'ok');

  return (
    <Modal title={`Invite a tenant to unit ${unit.unit_number}`} onClose={onClose}>
      {!invite ? (
        <form onSubmit={create} className="space-y-4">
          <p className="text-sm text-muted">
            The tenant uses a one-time code to create their own account. Their lease starts and ends on these dates.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Lease starts">
              <input className={inputCls} type="date" value={start} onChange={(e) => setStart(e.target.value)} required />
            </Field>
            <Field label="Lease ends">
              <input className={inputCls} type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} required />
            </Field>
          </div>
          <Button type="submit" busy={busy} className="w-full">
            Create invite code
          </Button>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-pine-tint p-5 text-center">
            <p className="text-sm text-pine">Invite code</p>
            <p className="font-display text-4xl font-bold tracking-[0.2em] text-pine">{invite.code}</p>
            <p className="mt-1 text-xs text-pine">Works once. Expires {shortDate(invite.expires_at)}.</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="quiet" onClick={() => copy(link, 'Invite link')}>
              Copy invite link
            </Button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md bg-pine px-4 py-2.5 text-sm font-medium text-white hover:bg-pine/90"
            >
              Send on WhatsApp
            </a>
          </div>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      )}
    </Modal>
  );
}

export default function Properties() {
  const { properties, units, payments, tenants, invites, entries, loading, error, reload } = useData();
  const { busy, run } = useAction();
  const [selected, setSelected] = useState<number | null>(null);
  const [modal, setModal] = useState<
    | { kind: 'property'; property?: Property }
    | { kind: 'unit'; propertyId: number; unit?: Unit }
    | { kind: 'invite'; unit: Unit }
    | { kind: 'entry'; propertyId: number; unitId: number }
    | null
  >(null);

  if (loading) return <Spinner />;
  if (error) return <Empty title="Could not load your data" action={<Button onClick={reload}>Try again</Button>}>{error}</Empty>;

  const remove = async (label: string, fn: () => Promise<unknown>) => {
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    await run(() => fn().then(reload), `${label} deleted.`);
    setSelected(null);
  };

  return (
    <>
      <PageHead
        title="Properties"
        sub="Tap a unit to see its photo, tenant and notebook."
        action={
          <Button onClick={() => setModal({ kind: 'property' })}>
            <Plus size={16} />
            Add property
          </Button>
        }
      />

      {properties.length === 0 && (
        <Empty title="No properties yet" action={<Button onClick={() => setModal({ kind: 'property' })}>Add property</Button>}>
          Add the building first, then its units.
        </Empty>
      )}

      <div className="space-y-12">
        {properties.map((p) => {
          const list = units.filter((u) => u.property_id === p.id);
          const unit = list.find((u) => u.id === selected);
          const tenant = unit && tenants.find((t) => t.id === unit.current_tenant_id);
          const openInvite = unit && invites.find((i) => i.unit_id === unit.id && !i.used);
          return (
            <section key={p.id}>
              <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-bold">{p.name}</h2>
                  <p className="text-muted">{p.address}</p>
                  <p className="tabular mt-1 text-sm text-muted">
                    {p.occupied_units} of {p.total_units} units occupied, {money(p.total_revenue_potential)} rent per month when full
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="quiet" onClick={() => setModal({ kind: 'unit', propertyId: p.id })}>
                    <Plus size={16} />
                    Add unit
                  </Button>
                  <Button variant="ghost" aria-label={`Edit ${p.name}`} onClick={() => setModal({ kind: 'property', property: p })}>
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" aria-label={`Delete ${p.name}`} onClick={() => remove(`"${p.name}"`, () => api.deleteProperty(p.id))}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              {list.length === 0 ? (
                <Empty title="No units in this property" action={<Button onClick={() => setModal({ kind: 'unit', propertyId: p.id })}>Add the first unit</Button>} />
              ) : (
                <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                  <div className="grid grid-cols-2 content-start gap-3 sm:grid-cols-3">
                    {list.map((u) => (
                      <UnitTile key={u.id} unit={u} tone={unitTone(u, payments)} selected={selected === u.id} onSelect={() => setSelected(u.id)} />
                    ))}
                  </div>

                  <div className="rounded-2xl border border-line bg-white p-5 shadow-sm">
                    {!unit ? (
                      <p className="text-sm text-muted">Choose a unit to see its tenant, photo, rent and notebook.</p>
                    ) : (
                      <div className="space-y-5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-xl font-bold">Unit {unit.unit_number}</h3>
                            <p className="text-sm text-muted">
                              {unit.floor === 0 || unit.floor == null ? 'Ground floor' : `Floor ${unit.floor}`}
                              {unit.bedrooms != null && `, ${unit.bedrooms} bed`}
                              {unit.bathrooms != null && `, ${unit.bathrooms} bath`}
                            </p>
                          </div>
                          <Pill tone={unit.status === 'occupied' ? 'pine' : unit.status === 'maintenance' ? 'ochre' : 'neutral'}>
                            {toneLabel[unitTone(unit, payments)].split(',')[0]}
                          </Pill>
                        </div>
                        <p className="tabular font-display text-2xl font-bold">
                          {money(unit.rent_amount)} <span className="text-sm font-normal text-muted">per month</span>
                        </p>

                        <PhotoCapture unit={unit} onChanged={reload} />

                        {tenant ? (
                          <div className="rounded-lg bg-plaster p-3 text-sm">
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-muted">{tenant.contact_info}</p>
                            <p className="text-muted">Lease until {shortDate(tenant.lease_end)}</p>
                            <Link to="/admin/tenants" className="mt-2 inline-block font-medium text-pine underline">
                              Open tenants
                            </Link>
                          </div>
                        ) : unit.status === 'vacant' ? (
                          <div className="rounded-lg bg-plaster p-3 text-sm">
                            {openInvite ? (
                              <p className="text-muted">
                                Invite code <span className="font-medium text-ink">{openInvite.code}</span> is waiting for a tenant until {shortDate(openInvite.expires_at)}.
                              </p>
                            ) : (
                              <p className="text-muted">This unit is empty.</p>
                            )}
                            <Button className="mt-3" onClick={() => setModal({ kind: 'invite', unit })}>
                              Invite a tenant
                            </Button>
                          </div>
                        ) : null}

                        <div className="border-t border-line pt-4">
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <h4 className="font-display text-lg font-bold">Notebook</h4>
                            <Button variant="quiet" onClick={() => setModal({ kind: 'entry', propertyId: p.id, unitId: unit.id })}>
                              <Plus size={16} />
                              Add
                            </Button>
                          </div>
                          {(() => {
                            const mine = entries.filter((e) => e.unit_id === unit.id);
                            const t = totals(mine);
                            return mine.length === 0 ? (
                              <p className="text-sm text-muted">Plans, budgets and expenses for this unit go here.</p>
                            ) : (
                              <>
                                <p className="tabular mb-1 text-sm text-muted">
                                  Planned {money(t.plannedOpen)}, spent {money(t.spent)}
                                </p>
                                <ul className="divide-y divide-line">
                                  {mine.map((e) => (
                                    <EntryRow key={e.id} entry={e} reload={reload} />
                                  ))}
                                </ul>
                              </>
                            );
                          })()}
                        </div>

                        <div className="flex gap-2 border-t border-line pt-4">
                          <Button variant="quiet" onClick={() => setModal({ kind: 'unit', propertyId: p.id, unit })}>
                            Edit unit
                          </Button>
                          <Button variant="danger" busy={busy} onClick={() => remove(`unit ${unit.unit_number}`, () => api.deleteUnit(unit.id))}>
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {modal?.kind === 'property' && <PropertyForm property={modal.property} onClose={() => setModal(null)} />}
      {modal?.kind === 'unit' && <UnitForm propertyId={modal.propertyId} unit={modal.unit} onClose={() => setModal(null)} />}
      {modal?.kind === 'invite' && <InviteModal unit={modal.unit} onClose={() => setModal(null)} />}
      {modal?.kind === 'entry' && <EntryModal kind="plan" propertyId={modal.propertyId} unitId={modal.unitId} onClose={() => setModal(null)} onSaved={reload} />}
    </>
  );
}
