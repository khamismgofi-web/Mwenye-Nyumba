import { FormEvent, useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button, Field, PageHead, Spinner, inputCls, useAction } from '../../components/ui';
import { api } from '../../lib/api';
import type { AuthConfig } from '../../types';
import { ChangePasswordForm } from '../AccountForm';

function Status({ on, label, help }: { on: boolean; label: string; help: string }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${on ? 'bg-pine text-white' : 'bg-line text-muted'}`}>
        {on ? <Check size={14} /> : <X size={14} />}
      </span>
      <div>
        <p className="font-medium">
          {label}: {on ? 'on' : 'not set up'}
        </p>
        <p className="text-sm text-muted">{help}</p>
      </div>
    </li>
  );
}

export default function Settings({ onGuide }: { onGuide: () => void }) {
  const { busy, run } = useAction();
  const [profile, setProfile] = useState<{ full_name: string; phone: string; email: string } | null>(null);
  const [config, setConfig] = useState<AuthConfig | null>(null);

  useEffect(() => {
    api.me().then((m) => setProfile({ full_name: m.full_name || '', phone: m.phone || '', email: m.email }));
    api.config().then(setConfig).catch(() => undefined);
  }, []);

  if (!profile) return <Spinner />;

  const save = (e: FormEvent) => {
    e.preventDefault();
    return run(() => api.updateProfile({ full_name: profile.full_name, phone: profile.phone }), 'Details saved.');
  };

  return (
    <>
      <PageHead title="Settings" sub={profile.email} />
      <div className="space-y-10">
        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Your details</h2>
          <form onSubmit={save} className="max-w-md space-y-4">
            <Field label="Full name">
              <input className={inputCls} value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} required minLength={2} />
            </Field>
            <Field label="Phone number" hint="With country code, like +255712345678. Messages from tenants are sent here by SMS.">
              <input
                className={inputCls}
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                required
                pattern="^\+\d[\d ]{6,}$"
                placeholder="+255712345678"
              />
            </Field>
            <Button type="submit" busy={busy}>
              Save details
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-xl font-bold">Tenant message alerts</h2>
          <p className="text-sm text-muted">When a tenant reports a problem you are told straight away, headed Message from tenant.</p>
          {config && (
            <ul className="mt-2 divide-y divide-line">
              <Status on={config.email_alerts} label="Email alerts" help={`Sent to ${profile.email}.`} />
              <Status on={config.sms_alerts} label="SMS alerts" help={profile.phone ? `Sent to ${profile.phone}.` : 'Add your phone number above first.'} />
              <Status on={config.photos} label="Unit photos" help="Photos are stored in a separate file store, not in the main database." />
            </ul>
          )}
          {config && (!config.email_alerts || !config.sms_alerts) && (
            <p className="mt-3 rounded-lg bg-ochre-tint p-3 text-sm text-ochre-ink">
              Anything marked not set up has not been connected on the server yet. Tenant reports still appear on the Repairs page.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold">Change password</h2>
          <ChangePasswordForm />
        </section>

        <section className="rounded-2xl border border-line bg-white p-6 shadow-sm">
          <h2 className="mb-2 text-xl font-bold">First time here?</h2>
          <p className="mb-4 text-sm text-muted">Watch the short guide again any time.</p>
          <Button variant="quiet" onClick={onGuide}>
            Show the guide
          </Button>
        </section>
      </div>
    </>
  );
}
