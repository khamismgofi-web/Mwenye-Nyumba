import { FormEvent, useState } from 'react';
import { Button, Empty, Field, Modal, PageHead, Pill, Spinner, inputCls, useAction } from '../../components/ui';
import { api } from '../../lib/api';
import { shortDate } from '../../lib/format';
import type { Repair } from '../../types';
import { useData } from './data';

export const priorityTone = { low: 'neutral', medium: 'ochre', high: 'brick', urgent: 'brick' } as const;
export const statusLabel = { pending: 'Reported', in_progress: 'In progress', completed: 'Done', cancelled: 'Cancelled' } as const;
const weight = { urgent: 0, high: 1, medium: 2, low: 3 } as const;

function EditRepair({ repair, onClose }: { repair: Repair; onClose: () => void }) {
  const { reload } = useData();
  const { busy, run } = useAction();
  const [f, setF] = useState({ status: repair.status, priority: repair.priority, admin_notes: repair.admin_notes || '' });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await run(() => api.updateRepair(repair.id, f).then(reload), 'Repair updated.');
    if (ok) onClose();
  };
  return (
    <Modal title={repair.title} onClose={onClose}>
      <p className="mb-1 text-sm text-muted">
        {repair.tenant_name}, unit {repair.unit_number}, reported {shortDate(repair.created_at)}
      </p>
      <p className="mb-5 leading-relaxed">{repair.description}</p>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Status">
            <select className={inputCls} value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as Repair['status'] })}>
              {Object.entries(statusLabel).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Priority">
            <select className={inputCls} value={f.priority} onChange={(e) => setF({ ...f, priority: e.target.value as Repair['priority'] })}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </Field>
        </div>
        <Field label="Note for the tenant" hint="The tenant can read this.">
          <textarea className={inputCls} rows={3} value={f.admin_notes} onChange={(e) => setF({ ...f, admin_notes: e.target.value })} />
        </Field>
        <Button type="submit" busy={busy} className="w-full">
          Save changes
        </Button>
      </form>
    </Modal>
  );
}

export default function Repairs() {
  const { repairs, loading, error, reload } = useData();
  const [editing, setEditing] = useState<Repair | null>(null);

  if (loading) return <Spinner />;
  if (error) return <Empty title="Could not load your data" action={<Button onClick={reload}>Try again</Button>}>{error}</Empty>;

  const columns: [string, Repair['status'][]][] = [
    ['Reported', ['pending']],
    ['In progress', ['in_progress']],
    ['Done', ['completed', 'cancelled']],
  ];

  return (
    <>
      <PageHead title="Repairs" sub="Tenants report problems from their account. Open one to set its status." />
      {repairs.length === 0 ? (
        <Empty title="No repair requests">When a tenant reports a problem it will show up here.</Empty>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {columns.map(([title, statuses]) => {
            const list = repairs
              .filter((r) => statuses.includes(r.status))
              .sort((a, b) => weight[a.priority] - weight[b.priority] || b.created_at.localeCompare(a.created_at));
            return (
              <section key={title}>
                <h2 className="mb-3 flex items-center gap-2 text-lg font-bold">
                  {title}
                  <span className="text-sm font-normal text-muted">{list.length}</span>
                </h2>
                <ul className="space-y-3">
                  {list.map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setEditing(r)}
                        className="w-full rounded-lg border border-line bg-white p-4 text-left transition-colors hover:border-pine"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium">{r.title}</p>
                          <Pill tone={priorityTone[r.priority]}>{r.priority}</Pill>
                        </div>
                        <p className="mt-1 line-clamp-2 text-sm text-muted">{r.description}</p>
                        <p className="mt-2 text-xs text-muted">
                          Unit {r.unit_number}, {r.property_name}, {shortDate(r.created_at)}
                          {r.status === 'cancelled' && ', cancelled'}
                        </p>
                      </button>
                    </li>
                  ))}
                  {list.length === 0 && <li className="rounded-lg border border-dashed border-line p-4 text-sm text-muted">Nothing here.</li>}
                </ul>
              </section>
            );
          })}
        </div>
      )}
      {editing && <EditRepair repair={editing} onClose={() => setEditing(null)} />}
    </>
  );
}
