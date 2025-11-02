import { Decimal } from '@prisma/client/runtime/library';

export function toNumber(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  if (value instanceof Decimal) return Number(value.toString());
  if (typeof value === 'string') return Number(value);
  return Number(value as any);
}

export function toPlain<T extends Record<string, any>>(data: T): T {
  const out: any = Array.isArray(data) ? [] : {};

  for (const [key, val] of Object.entries(data)) {
    if (val instanceof Decimal) out[key] = Number(val.toString());
    else if (Array.isArray(val)) out[key] = val.map((v) => (v instanceof Decimal ? Number(v.toString()) : v));
    else if (val && typeof val === 'object' && !(val instanceof Date) && !(val === null)) {
      out[key] = toPlain(val);
    } else out[key] = val;
  }

  return out;
}

