import { useEffect, useState } from 'react';
import { Check, MessageSquare } from 'lucide-react';
import { Button } from './ui';

const frame = 'relative h-52 overflow-hidden rounded-xl bg-pine-deep';

function NotebookToApp() {
  return (
    <div className={`${frame} flex items-center justify-center gap-4 px-4`}>
      <div className="notebook-paper anim-rise w-36 -rotate-3 rounded-md p-3 pl-12 text-[17px] leading-8 text-ink shadow-lg">
        <p>Rm 3 Juma 150k?</p>
        <p>tap broken rm 5</p>
        <p>paint = 80,000</p>
      </div>
      <svg width="34" height="20" viewBox="0 0 34 20" className="shrink-0">
        <path d="M2 10h26m-8-8 8 8-8 8" stroke="#e5a52e" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="400" style={{ animation: 'draw 1.2s 0.4s both' }} />
      </svg>
      <div className="w-36 space-y-2">
        <div className="anim-pop d2 rounded-lg bg-pine px-3 py-2 text-xs text-white">
          <p className="text-white/70">Collected</p>
          <p className="font-display text-base font-bold">TSh 2.4M</p>
        </div>
        <div className="anim-pop d3 rounded-lg bg-ochre-tint px-3 py-2 text-xs text-ochre-ink">
          <p className="font-semibold">Plan: repaint A3</p>
          <p>Budget 80,000</p>
        </div>
        <div className="anim-pop d4 rounded-lg bg-white px-3 py-2 text-xs text-ink">
          <p className="font-semibold">Repair: tap, unit 5</p>
        </div>
      </div>
    </div>
  );
}

function Building() {
  const units = ['A1', 'A2', 'A3', 'B1', 'B2', 'B3'];
  return (
    <div className={`${frame} flex items-center justify-center`}>
      <div className="grid grid-cols-3 gap-2">
        {units.map((u, i) => (
          <div
            key={u}
            className={`anim-pop flex h-16 w-20 items-end rounded-lg p-2 text-xs font-bold ${
              i % 3 === 1 ? 'bg-ochre text-ink' : 'bg-pine text-white'
            }`}
            style={{ animationDelay: `${i * 0.18}s` }}
          >
            {u}
          </div>
        ))}
      </div>
    </div>
  );
}

function PhotoShot() {
  return (
    <div className={`${frame} flex items-center justify-center`}>
      <div className="relative h-36 w-52 overflow-hidden rounded-lg border-4 border-white bg-gradient-to-b from-sky-300 to-sky-100 shadow-xl">
        <div className="absolute bottom-0 h-14 w-full bg-emerald-600" />
        <div className="absolute bottom-10 left-8 h-16 w-24 rounded-sm bg-amber-100">
          <div className="absolute -top-6 left-0 h-0 w-0 border-x-[48px] border-b-[26px] border-x-transparent border-b-brick" />
          <div className="absolute bottom-0 left-9 h-9 w-6 bg-ochre-ink" />
        </div>
        <div className="absolute inset-0 bg-white" style={{ animation: 'flash 2.4s 0.6s infinite' }} />
        <div className="anim-pop d4 absolute right-2 top-2 flex items-center gap-1 rounded-full bg-pine px-2 py-1 text-xs font-semibold text-white">
          <Check size={12} /> Saved
        </div>
      </div>
    </div>
  );
}

function Invite() {
  return (
    <div className={`${frame} flex flex-col items-center justify-center gap-4`}>
      <div className="anim-rise rounded-lg bg-white px-5 py-3 text-center">
        <p className="text-xs text-muted">Invite code</p>
        <p className="overflow-hidden whitespace-nowrap font-display text-2xl font-bold tracking-[0.2em] text-pine" style={{ width: '8ch', animation: 'type 1.4s steps(8) 0.4s both' }}>
          K7M2QX9A
        </p>
      </div>
      <div className="anim-slide d5 max-w-[15rem] rounded-2xl rounded-tr-sm bg-[#d9fdd3] px-3 py-2 text-xs text-ink shadow">
        Please create your tenant account for unit A1. Tap the link.
      </div>
    </div>
  );
}

function Alerts() {
  return (
    <div className={`${frame} flex items-center justify-center gap-4 px-4`}>
      <div className="anim-slide w-44 rounded-2xl bg-white p-3 text-xs text-ink shadow-xl">
        <p className="mb-1 flex items-center gap-1 font-semibold text-pine">
          <MessageSquare size={12} /> SMS
        </p>
        <p className="font-semibold">Message from tenant:</p>
        <p>Amina, unit A1. Kitchen tap leaking.</p>
      </div>
      <div className="space-y-2">
        <div className="anim-pop d3 rounded-lg bg-brick-tint px-3 py-2 text-xs font-semibold text-brick">Rent overdue: unit B2</div>
        <div className="anim-pop d4 rounded-lg bg-pine-tint px-3 py-2 text-xs font-semibold text-pine">Paid: unit A3</div>
        <div className="anim-pop d5 rounded-lg bg-ochre-tint px-3 py-2 text-xs font-semibold text-ochre-ink">Spent this month: 120,000</div>
      </div>
    </div>
  );
}

const steps = [
  {
    title: 'Your notebook, upgraded',
    text: 'Everything you write down about your houses lives here now: rent, repairs, plans and budgets. Nothing gets lost, and it is always in your pocket.',
    art: <NotebookToApp />,
  },
  {
    title: 'Add your property and its units',
    text: 'Start with the building, then add each unit with its monthly rent. Do this once and you are set.',
    art: <Building />,
  },
  {
    title: 'Take a real photo of every unit',
    text: 'Open a unit and tap Take photo. Your phone camera opens, and the picture becomes the unit card. Photos are kept safely outside the main database.',
    art: <PhotoShot />,
  },
  {
    title: 'Invite tenants with a one-time code',
    text: 'Press Invite a tenant on a vacant unit and send the link on WhatsApp. The tenant makes their own account, so you never share passwords.',
    art: <Invite />,
  },
  {
    title: 'Rent, repairs and messages in one place',
    text: 'Tenants report problems in the app, and you get an SMS or email titled Message from tenant. Record rent as it arrives and keep plans and expenses in the Notebook.',
    art: <Alerts />,
  },
];

export function Tour({ onClose }: { onClose: () => void }) {
  const [i, setI] = useState(0);
  const last = i === steps.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight' && !last) setI((n) => n + 1);
      if (e.key === 'ArrowLeft' && i > 0) setI((n) => n - 1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [i, last, onClose]);

  const step = steps[i];
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-ink/60 p-0 sm:items-center sm:p-6">
      <div role="dialog" aria-modal="true" aria-label="How Mwenye Nyumba works" className="w-full rounded-t-2xl bg-white p-5 shadow-2xl sm:max-w-lg sm:rounded-2xl">
        <div key={i}>{step.art}</div>
        <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-pine">
          Step {i + 1} of {steps.length}
        </p>
        <h2 className="mt-1 text-2xl font-bold">{step.title}</h2>
        <p className="mt-2 leading-relaxed text-muted">{step.text}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            {steps.map((_, n) => (
              <span key={n} className={`h-2 rounded-full transition-all ${n === i ? 'w-6 bg-pine' : 'w-2 bg-line'}`} />
            ))}
          </div>
          <div className="flex gap-2">
            {i === 0 ? (
              <Button variant="ghost" onClick={onClose}>
                Skip
              </Button>
            ) : (
              <Button variant="quiet" onClick={() => setI(i - 1)}>
                Back
              </Button>
            )}
            <Button onClick={() => (last ? onClose() : setI(i + 1))}>{last ? 'Start' : 'Next'}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
