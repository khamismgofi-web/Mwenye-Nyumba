const CURRENCY = (import.meta.env.VITE_CURRENCY as string | undefined) || 'TSh';

export const money = (n: number | null | undefined) =>
  `${CURRENCY} ${Math.round(n || 0).toLocaleString('en-US')}`;

export const todayIso = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const toDate = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);

export const shortDate = (iso?: string | null) =>
  iso ? toDate(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

export const addYears = (iso: string, years: number) => {
  const d = toDate(iso);
  d.setFullYear(d.getFullYear() + years);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const daysUntil = (iso: string) =>
  Math.round((toDate(iso).getTime() - toDate(todayIso()).getTime()) / 86400000);

export const methodLabel: Record<string, string> = {
  mpesa: 'M-Pesa',
  bank_transfer: 'Bank transfer',
  cash: 'Cash',
  credit_card: 'Card',
  other: 'Other',
};

export const randomPassword = () => {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint32Array(12));
  return Array.from(bytes, (b) => chars[b % chars.length]).join('');
};

export const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
