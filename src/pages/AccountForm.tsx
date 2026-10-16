import { FormEvent, useState } from 'react';
import { api } from '../lib/api';
import { Button, Field, inputCls, useAction } from '../components/ui';

export function ChangePasswordForm() {
  const { busy, run } = useAction();
  const [f, setF] = useState({ current_password: '', new_password: '' });
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const ok = await run(() => api.changePassword(f), 'Password changed.');
    if (ok) setF({ current_password: '', new_password: '' });
  };
  return (
    <form onSubmit={submit} className="max-w-md space-y-4">
      <Field label="Current password">
        <input className={inputCls} type="password" autoComplete="current-password" value={f.current_password} onChange={(e) => setF({ ...f, current_password: e.target.value })} required />
      </Field>
      <Field label="New password" hint="At least 8 characters.">
        <input className={inputCls} type="password" autoComplete="new-password" minLength={8} maxLength={72} value={f.new_password} onChange={(e) => setF({ ...f, new_password: e.target.value })} required />
      </Field>
      <Button type="submit" busy={busy}>
        Change password
      </Button>
    </form>
  );
}
