import { useEffect, useState } from 'react';
import { Camera, MessageSquare, NotebookPen, Wallet } from 'lucide-react';
import { Wordmark } from '../components/Shell';
import { api } from '../lib/api';
import { Link } from '../lib/router';

const features = [
  {
    icon: <Wallet size={22} />,
    title: 'Rent, always up to date',
    text: 'Record M-Pesa, bank and cash payments against each tenant. Rent past its due date is marked overdue by itself.',
  },
  {
    icon: <MessageSquare size={22} />,
    title: 'Repairs arrive as a message',
    text: 'Tenants report a problem in the app. You get an SMS or email headed Message from tenant, with the unit and the details. No more WhatsApp calls.',
  },
  {
    icon: <NotebookPen size={22} />,
    title: 'Your notebook, organised',
    text: 'Plans for each unit, budgets, and every expense in one place, with what is left after costs worked out for you.',
  },
  {
    icon: <Camera size={22} />,
    title: 'Real photos of every unit',
    text: 'Open the camera from the app and the photo becomes the unit card. See your whole property at a glance.',
  },
];

export default function Landing() {
  const [canSignUp, setCanSignUp] = useState(false);
  useEffect(() => {
    api.config().then((c) => setCanSignUp(c.landlord_signup_enabled)).catch(() => setCanSignUp(false));
  }, []);

  return (
    <div>
      <section className="relative overflow-hidden bg-pine-deep text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-pine/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 h-80 w-80 rounded-full bg-ochre/20 blur-3xl" />

        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-10">
          <Wordmark light />
          <nav className="flex items-center gap-3 text-sm font-medium">
            <Link to="/register" className="hidden text-white/75 hover:text-white sm:inline">
              I am a tenant
            </Link>
            <Link to="/login" className="rounded-lg bg-white/10 px-4 py-2 hover:bg-white/20">
              Sign in
            </Link>
          </nav>
        </header>

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-24 pt-10 md:grid-cols-[1.05fr_1fr] md:px-10 md:pt-16">
          <div className="anim-rise">
            <p className="mb-4 inline-block rounded-full bg-ochre/20 px-3 py-1 text-sm font-semibold text-ochre">For landlords who still use a notebook</p>
            <h1 className="text-5xl font-extrabold leading-[1.02] md:text-6xl">
              Close the notebook.
              <br />
              <span className="text-ochre">Run your rentals</span> from one place.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/80">
              Rent, repairs, budgets and plans for every unit, together. Tenants report problems in the app and you hear about
              it by SMS or email straight away.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {canSignUp ? (
                <Link to="/landlord" className="rounded-lg bg-ochre px-6 py-3.5 font-semibold text-ink shadow-lg hover:brightness-95">
                  Create landlord account
                </Link>
              ) : (
                <Link to="/login" className="rounded-lg bg-ochre px-6 py-3.5 font-semibold text-ink shadow-lg hover:brightness-95">
                  Sign in as landlord
                </Link>
              )}
              <Link to="/register" className="rounded-lg border border-white/30 px-6 py-3.5 font-semibold hover:bg-white/10">
                I have a tenant invite code
              </Link>
            </div>
          </div>

          <div className="relative mx-auto h-[26rem] w-full max-w-md" aria-hidden="true">
            <div className="notebook-paper anim-rise d1 absolute left-0 top-6 w-56 -rotate-6 rounded-md p-4 pl-14 text-[21px] leading-8 text-ink shadow-2xl">
              <p>Rm 3 - Juma</p>
              <p>paid 150k??</p>
              <p className="line-through decoration-brick">tap broken rm 5</p>
              <p>paint = 80,000</p>
              <p>Mama Neema late</p>
            </div>

            <div className="anim-slide d3 absolute right-0 top-0 w-60 rounded-2xl bg-white p-4 text-ink shadow-2xl">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Collected this month</p>
              <p className="tabular font-display text-3xl font-extrabold text-pine">TSh 2,450,000</p>
              <div className="mt-2 h-2 rounded-full bg-line">
                <div className="h-2 w-4/5 rounded-full bg-pine" />
              </div>
              <p className="mt-1 text-xs text-muted">8 of 10 units paid</p>
            </div>

            <div className="anim-slide d4 absolute right-6 top-40 w-64 rounded-2xl border-l-4 border-ochre bg-white p-4 text-ink shadow-2xl">
              <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-ochre-ink">
                <MessageSquare size={13} /> Message from tenant
              </p>
              <p className="mt-1 text-sm font-semibold">Amina Juma, unit A1</p>
              <p className="text-sm text-muted">Kitchen tap is leaking under the sink.</p>
            </div>

            <div className="anim-slide d5 absolute bottom-0 left-8 flex w-64 items-center gap-3 rounded-2xl bg-white p-3 text-ink shadow-2xl">
              <div className="relative h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-sky-300 to-sky-100">
                <div className="absolute bottom-0 h-5 w-full bg-emerald-600" />
                <div className="absolute bottom-3 left-3 h-7 w-9 bg-amber-100" />
                <div className="absolute bottom-9 left-2 h-0 w-0 border-x-[22px] border-b-[12px] border-x-transparent border-b-brick" />
              </div>
              <div>
                <p className="text-sm font-bold">Unit A3</p>
                <p className="text-xs text-muted">Plan: repaint, budget 80,000</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-10">
        <h2 className="max-w-xl text-4xl font-extrabold">Everything the notebook did, and what it never could</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-line bg-white p-6 shadow-sm">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-pine text-white">{f.icon}</span>
              <h3 className="text-xl font-bold">{f.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-pine text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 py-16 md:grid-cols-3 md:px-10">
          {[
            ['1', 'Add your units', 'Create the building, add each unit with its rent and take its photo.'],
            ['2', 'Invite tenants', 'Send a one-time code by WhatsApp. Tenants create their own accounts.'],
            ['3', 'Stop writing it down', 'Record rent, read messages and track costs. The app does the remembering.'],
          ].map(([n, title, text]) => (
            <div key={n}>
              <span className="font-display text-5xl font-extrabold text-ochre">{n}</span>
              <h3 className="mt-2 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-white/80">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 bg-pine-deep px-5 py-8 text-sm text-white/70 md:px-10">
        <Wordmark light />
        <span>Landlords and tenants each have their own private space. Nobody sees another household.</span>
      </footer>
    </div>
  );
}
