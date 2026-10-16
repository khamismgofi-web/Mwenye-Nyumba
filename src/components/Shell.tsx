import React from 'react';
import { HelpCircle, LogOut } from 'lucide-react';
import { useAuth } from '../auth';
import { Link } from '../lib/router';

export interface NavItem {
  key: string;
  label: string;
  to: string;
  icon: React.ReactNode;
}

export function Wordmark({ light }: { light?: boolean }) {
  return (
    <span className={`font-display text-xl font-extrabold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
      Mwenye<span className="text-ochre">.</span>Nyumba
    </span>
  );
}

export function Shell({
  items,
  current,
  onGuide,
  children,
}: {
  items: NavItem[];
  current: string;
  onGuide?: () => void;
  children: React.ReactNode;
}) {
  const { session, logout } = useAuth();
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-64 shrink-0 flex-col bg-pine-deep md:flex">
        <div className="px-6 py-7">
          <Link to="/">
            <Wordmark light />
          </Link>
        </div>
        <nav aria-label="Main" className="flex-1 space-y-1 px-3">
          {items.map((it) => (
            <Link
              key={it.key}
              to={it.to}
              aria-current={current === it.key ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-lg border-l-4 px-3 py-2.5 text-sm font-medium transition-colors ${
                current === it.key
                  ? 'border-ochre bg-white/10 text-white'
                  : 'border-transparent text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              {it.icon}
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="space-y-2 border-t border-white/10 p-4">
          {onGuide && (
            <button
              type="button"
              onClick={onGuide}
              className="flex w-full items-center gap-2 rounded-lg bg-ochre/15 px-3 py-2 text-sm font-medium text-ochre hover:bg-ochre/25"
            >
              <HelpCircle size={16} />
              How it works
            </button>
          )}
          <p className="truncate px-1 text-xs text-white/60" title={session?.email}>
            {session?.email}
          </p>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 px-1 text-sm font-medium text-white/80 hover:text-white"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="bg-pine-deep md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Wordmark light />
            <div className="flex items-center gap-3 text-white/80">
              {onGuide && (
                <button type="button" aria-label="How it works" onClick={onGuide}>
                  <HelpCircle size={20} />
                </button>
              )}
              <button type="button" onClick={logout} className="flex items-center gap-1.5 text-sm font-medium">
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </div>
          <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-2">
            {items.map((it) => (
              <Link
                key={it.key}
                to={it.to}
                aria-current={current === it.key ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ${
                  current === it.key ? 'bg-ochre text-ink' : 'text-white/75'
                }`}
              >
                {it.icon}
                {it.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}
