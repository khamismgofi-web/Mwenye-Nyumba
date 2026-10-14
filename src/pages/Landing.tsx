import { Elevation, ElevationLegend, ElevationUnit } from '../components/Elevation';
import { Wordmark } from '../components/Shell';
import { Link } from '../lib/router';
import type { Tone } from '../lib/derive';

const layout: Tone[][] = [
  ['paid', 'paid', 'overdue', 'paid'],
  ['paid', 'vacant', 'paid', 'paid'],
  ['overdue', 'paid', 'repair', 'paid'],
  ['paid', 'paid', 'vacant', 'paid'],
];

const sample: ElevationUnit[] = layout.flatMap((row, i) =>
  row.map((tone, j) => ({ id: i * 10 + j, label: `${4 - i}${String.fromCharCode(65 + j)}`, floor: 4 - i, tone })),
);

const features = [
  ['Rent', 'Record M-Pesa, bank and cash payments against each tenant. Rent that is past its due date is marked overdue the same day.'],
  ['Repairs', 'Tenants report a problem from their phone. You set the priority and update the status, and they see every change.'],
  ['Tenants', 'Give each tenant a one-time code for their unit. They create their own account, so you never choose or share a password.'],
];

const steps = [
  'Pick a vacant unit and create an invite code.',
  'Send the invite link to the tenant, by WhatsApp if you like.',
  'The tenant registers, and their lease starts on the dates you set.',
];

export default function Landing() {
  return (
    <div>
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 md:px-10">
        <Wordmark />
        <nav className="flex items-center gap-5 text-sm font-medium">
          <Link to="/register" className="text-muted hover:text-ink">
            Have an invite code?
          </Link>
          <Link to="/login" className="rounded-md border border-line bg-white px-4 py-2 hover:border-ink/40">
            Sign in
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-10 md:grid-cols-[1.05fr_1fr] md:px-10 md:pt-16">
        <div>
          <h1 className="text-5xl font-bold leading-[1.05] md:text-6xl">See which doors are paid up.</h1>
          <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted">
            Mwenye Nyumba keeps your buildings, tenants, rent and repairs in one place. It is made for family rental
            businesses that still run on a notebook and phone calls.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/login" className="rounded-md bg-pine px-5 py-3 text-sm font-medium text-white hover:bg-pine/90">
              Sign in as landlord
            </Link>
            <Link
              to="/register"
              className="rounded-md border border-line bg-white px-5 py-3 text-sm font-medium hover:border-ink/40"
            >
              Join with an invite code
            </Link>
          </div>
        </div>

        <figure>
          <Elevation units={sample} />
          <div className="mt-5">
            <ElevationLegend />
          </div>
          <figcaption className="mt-3 text-center text-xs text-muted">
            A sample building. Each window is a unit.
          </figcaption>
        </figure>
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-5 py-16 md:px-10">
          <h2 className="text-3xl font-bold">What it keeps track of</h2>
          <dl className="mt-8 divide-y divide-line border-y border-line">
            {features.map(([title, text]) => (
              <div key={title} className="grid gap-2 py-6 md:grid-cols-[200px_1fr] md:gap-10">
                <dt className="font-display text-xl font-bold">{title}</dt>
                <dd className="max-w-xl leading-relaxed text-muted">{text}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-16 md:px-10">
        <h2 className="text-3xl font-bold">Adding a tenant takes three steps</h2>
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {steps.map((text, i) => (
            <li key={text} className="border-t-2 border-ink pt-4">
              <span className="font-display text-2xl font-bold text-pine">{i + 1}</span>
              <p className="mt-2 leading-relaxed">{text}</p>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-line py-8 text-center text-sm text-muted">Mwenye Nyumba</footer>
    </div>
  );
}
