import React from 'react';
import { LogOut } from 'lucide-react';
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
    <span className={`font-display text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-ink'}`}>
      Mwenye Nyumba
    </span>
  );
}

export function Shell({ items, current, children }: { items: NavItem[]; current: string; children: React.ReactNode }) {
  const { session, logout } = useAuth();
  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-line bg-white md:flex">
        <div className="px-6 py-6">
          <Link to="/">
            <Wordmark />
          </Link>
        </div>
        <nav aria-label="Main" className="flex-1 space-y-1 px-3">
          {items.map((it) => (
            <Link
              key={it.key}
              to={it.to}
              aria-current={current === it.key ? 'page' : undefined}
              className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                current === it.key ? 'bg-pine-tint text-pine' : 'text-muted hover:bg-ink/5 hover:text-ink'
              }`}
            >
              {it.icon}
              {it.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-line p-4">
          <p className="truncate text-sm text-muted" title={session?.email}>
            {session?.email}
          </p>
          <button
            type="button"
            onClick={logout}
            className="mt-2 flex items-center gap-2 text-sm font-medium text-ink hover:text-brick"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="border-b border-line bg-white md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Wordmark />
            <button type="button" onClick={logout} className="flex items-center gap-1.5 text-sm font-medium">
              <LogOut size={16} />
              Sign out
            </button>
          </div>
          <nav aria-label="Main" className="flex gap-1 overflow-x-auto px-3 pb-2">
            {items.map((it) => (
              <Link
                key={it.key}
                to={it.to}
                aria-current={current === it.key ? 'page' : undefined}
                className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
                  current === it.key ? 'bg-pine-tint text-pine' : 'text-muted'
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
