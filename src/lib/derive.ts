import type { Payment, PaymentStatus, Unit } from '../types';
import { todayIso } from './format';

export type Tone = 'paid' | 'overdue' | 'vacant' | 'repair';

export const effectiveStatus = (p: Payment): PaymentStatus =>
  p.status === 'pending' && p.due_date < todayIso() ? 'overdue' : p.status;

export function unitTone(unit: Unit, payments: Payment[]): Tone {
  if (unit.status === 'maintenance') return 'repair';
  if (unit.status === 'vacant' || !unit.current_tenant_id) return 'vacant';
  const late = payments.some((p) => p.tenant_id === unit.current_tenant_id && effectiveStatus(p) === 'overdue');
  return late ? 'overdue' : 'paid';
}

export const toneLabel: Record<Tone, string> = {
  paid: 'occupied, rent up to date',
  overdue: 'occupied, rent overdue',
  vacant: 'vacant',
  repair: 'under repair',
};
