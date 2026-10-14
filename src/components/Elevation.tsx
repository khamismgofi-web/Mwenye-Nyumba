import { useMemo } from 'react';
import type { Tone } from '../lib/derive';
import { toneLabel } from '../lib/derive';

export interface ElevationUnit {
  id: number;
  label: string;
  floor: number;
  tone: Tone;
}

export function Elevation({
  units,
  selectedId,
  onSelect,
}: {
  units: ElevationUnit[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
}) {
  const floors = useMemo(() => {
    const map = new Map<number, ElevationUnit[]>();
    units.forEach((u) => map.set(u.floor, [...(map.get(u.floor) || []), u]));
    return [...map.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([floor, list]) => [floor, [...list].sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }))] as const);
  }, [units]);

  return (
    <div className="max-w-full overflow-x-auto px-3 pb-2 pt-1">
      <div className="elevation">
        <div className="elevation-roof" />
        <div className="elevation-body">
          {floors.map(([floor, list]) => (
            <div key={floor} className="elevation-floor">
              <span className="elevation-level">{floor === 0 ? 'G' : `L${floor}`}</span>
              <div className="flex flex-wrap gap-x-3 gap-y-2">
                {list.map((u) => {
                  const text = `Unit ${u.label}, ${toneLabel[u.tone]}`;
                  return (
                    <div key={u.id} className="w-[76px]">
                      {onSelect ? (
                        <button
                          type="button"
                          className="window"
                          data-tone={u.tone}
                          aria-pressed={selectedId === u.id}
                          aria-label={text}
                          title={text}
                          onClick={() => onSelect(u.id)}
                        />
                      ) : (
                        <div className="window" data-tone={u.tone} role="img" aria-label={text} title={text} />
                      )}
                      <div className="mt-1 truncate text-center text-xs text-muted">{u.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div className="elevation-ground" />
      </div>
    </div>
  );
}

export function ElevationLegend() {
  const items: Tone[] = ['paid', 'overdue', 'repair', 'vacant'];
  const text: Record<Tone, string> = {
    paid: 'Rent up to date',
    overdue: 'Rent overdue',
    repair: 'Under repair',
    vacant: 'Vacant',
  };
  return (
    <ul className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-xs text-muted">
      {items.map((t) => (
        <li key={t} className="flex items-center gap-2">
          <span className="swatch" data-tone={t} />
          {text[t]}
        </li>
      ))}
    </ul>
  );
}
