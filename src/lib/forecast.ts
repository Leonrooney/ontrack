export type ForecastMethod = 'ma' | 'es';

export interface ForecastPoint {
  date: string; // YYYY-MM-DD
  actual?: number; // present on history points
  predicted: number; // present on future points
  lower?: number; // simple band
  upper?: number;
}

export function movingAverage(series: number[], window = 7): number[] {
  if (window <= 0) throw new Error('window must be > 0');
  const out: number[] = [];

  for (let i = 0; i < series.length; i++) {
    const start = Math.max(0, i - window + 1);
    const subset = series.slice(start, i + 1);
    out.push(subset.reduce((a, b) => a + b, 0) / subset.length);
  }

  return out;
}

export function exponentialSmoothing(series: number[], alpha = 0.3): number[] {
  if (alpha <= 0 || alpha >= 1) throw new Error('alpha must be in (0,1)');
  if (series.length === 0) return [];

  const out = [series[0]];

  for (let i = 1; i < series.length; i++) {
    out.push(alpha * series[i] + (1 - alpha) * out[i - 1]);
  }

  return out;
}

export function naiveStdDevResiduals(actual: number[], fitted: number[]): number {
  const n = Math.min(actual.length, fitted.length);
  if (n < 2) return 0;

  const residuals = actual.slice(-n).map((a, i) => a - fitted[fitted.length - n + i]);
  const mean = residuals.reduce((a, b) => a + b, 0) / n;
  const varSum = residuals.reduce((a, r) => a + (r - mean) * (r - mean), 0);

  return Math.sqrt(varSum / (n - 1));
}

export function buildHorizon(lastDate: Date, horizon: number): string[] {
  const out: string[] = [];
  const d = new Date(lastDate);

  for (let i = 1; i <= horizon; i++) {
    d.setDate(d.getDate() + 1);
    out.push(d.toISOString().slice(0, 10));
  }

  return out;
}

export function forecastSeries(
  dates: string[],
  series: number[],
  horizon: number,
  method: ForecastMethod,
  opts?: { window?: number; alpha?: number; bandK?: number }
): { history: ForecastPoint[]; future: ForecastPoint[] } {
  const bandK = opts?.bandK ?? 1; // ~1 std band
  let fitted: number[];

  if (method === 'ma') {
    const w = opts?.window ?? 7;
    fitted = movingAverage(series, w);
  } else {
    const a = opts?.alpha ?? 0.3;
    fitted = exponentialSmoothing(series, a);
  }

  // std of residuals for a simple band
  const sd = naiveStdDevResiduals(series, fitted);

  // last fitted as base for recursive future (flat ES/MA extension)
  const last = fitted[fitted.length - 1] ?? (series.at(-1) ?? 0);
  const preds = Array.from({ length: horizon }, () => last);

  const lastDate = new Date(dates[dates.length - 1]);
  const futureDates = buildHorizon(lastDate, horizon);

  return {
    history: dates.map((d, i) => ({
      date: d,
      actual: series[i] ?? 0,
      predicted: fitted[i] ?? series[i] ?? 0,
      lower: (fitted[i] ?? series[i] ?? 0) - bandK * sd,
      upper: (fitted[i] ?? series[i] ?? 0) + bandK * sd,
    })),
    future: futureDates.map((d) => ({
      date: d,
      predicted: last,
      lower: last - bandK * sd,
      upper: last + bandK * sd,
    })),
  };
}

