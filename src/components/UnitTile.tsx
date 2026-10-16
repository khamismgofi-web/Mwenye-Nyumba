import { Camera } from 'lucide-react';
import type { Tone } from '../lib/derive';
import { toneLabel } from '../lib/derive';
import { money } from '../lib/format';
import type { Unit } from '../types';

const badge: Record<Tone, string> = {
  paid: 'bg-pine text-white',
  overdue: 'bg-brick text-white',
  vacant: 'bg-white text-ink',
  repair: 'bg-ochre text-ink',
};

const badgeText: Record<Tone, string> = {
  paid: 'Paid up',
  overdue: 'Rent overdue',
  vacant: 'Vacant',
  repair: 'Under repair',
};

export function UnitTile({
  unit,
  tone,
  selected,
  onSelect,
}: {
  unit: Unit;
  tone: Tone;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const label = `Unit ${unit.unit_number}, ${toneLabel[tone]}${unit.photo_url ? '' : ', no photo yet'}`;
  const inner = (
    <>
      {unit.photo_url ? (
        <img src={unit.photo_url} alt="" loading="lazy" />
      ) : (
        <div className="unit-tile-empty">
          <Camera size={22} />
          No photo yet
        </div>
      )}
      <div className="unit-tile-shade" />
      <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow ${badge[tone]}`}>
        {badgeText[tone]}
      </span>
      <div className="absolute inset-x-3 bottom-3">
        <p className="font-display text-xl font-bold leading-tight">Unit {unit.unit_number}</p>
        <p className="tabular truncate text-xs text-white/85">
          {unit.current_tenant_name ? `${unit.current_tenant_name}, ` : ''}
          {money(unit.rent_amount)}
        </p>
      </div>
    </>
  );
  if (!onSelect) {
    return (
      <div className="unit-tile" role="img" aria-label={label}>
        {inner}
      </div>
    );
  }
  return (
    <button type="button" className="unit-tile" aria-pressed={!!selected} aria-label={label} onClick={onSelect}>
      {inner}
    </button>
  );
}
