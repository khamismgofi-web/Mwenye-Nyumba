import type React from 'react';
import { FormEvent, useState } from 'react';
import { useAuth } from '../auth';
import { Button, Field, inputCls } from '../components/ui';
import { Wordmark } from '../components/Shell';
import { Link, go } from '../lib/router';

export default function AuthPage({ mode, code = '' }: { mode: 'login' | 'register'; code?: string }) {
  const { login, register } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '', invite_code: code });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const s =
        mode === 'login'
          ? await login(form.email, form.password)
          : await register({ ...form, invite_code: form.invite_code.trim() });
      go(s.role === 'admin' ? '/admin/overview' : '/home');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const isLogin = mode === 'login';

  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-6xl px-5 py-5 md:px-10">
        <Link to="/">
          <Wordmark />
        </Link>
      </header>
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-16">
        <h1 className="text-3xl font-bold">{isLogin ? 'Sign in' : 'Create your tenant account'}</h1>
        <p className="mt-2 text-muted">
          {isLogin
            ? 'Landlords and tenants sign in here.'
            : 'You need the invite code your landlord sent you. It works once.'}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {!isLogin && (
            <>
              <Field label="Invite code">
                <input
                  className={`${inputCls} uppercase tracking-widest`}
                  value={form.invite_code}
                  onChange={set('invite_code')}
                  required
                  minLength={6}
                  maxLength={12}
                  autoComplete="off"
                />
              </Field>
              <Field label="Full name">
                <input className={inputCls} value={form.full_name} onChange={set('full_name')} required autoComplete="name" />
              </Field>
              <Field label="Phone number" hint="Your landlord uses this to reach you.">
                <input className={inputCls} type="tel" value={form.phone} onChange={set('phone')} required minLength={5} autoComplete="tel" />
              </Field>
            </>
          )}
          <Field label="Email">
            <input className={inputCls} type="email" value={form.email} onChange={set('email')} required autoComplete="email" />
          </Field>
          <Field label="Password" hint={isLogin ? undefined : 'At least 8 characters.'}>
            <input
              className={inputCls}
              type="password"
              value={form.password}
              onChange={set('password')}
              required
              minLength={isLogin ? undefined : 8}
              maxLength={72}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
            />
          </Field>

          {error && (
            <p role="alert" className="rounded-md bg-brick-tint px-3 py-2 text-sm text-brick">
              {error}
            </p>
          )}

          <Button type="submit" busy={busy} className="w-full">
            {isLogin ? 'Sign in' : 'Create account'}
          </Button>
        </form>

        <p className="mt-6 text-sm text-muted">
          {isLogin ? (
            <>
              New tenant?{' '}
              <Link to="/register" className="font-medium text-pine underline">
                Use your invite code
              </Link>
            </>
          ) : (
            <>
              Already registered?{' '}
              <Link to="/login" className="font-medium text-pine underline">
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
