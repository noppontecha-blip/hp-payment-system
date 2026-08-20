const currencyFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number | null | undefined): string {
  return `฿${currencyFormatter.format(amount ?? 0)}`;
}

export function formatNumber(amount: number | null | undefined): string {
  return currencyFormatter.format(amount ?? 0);
}

// Supabase Storage object keys are UTF-8 safe, but characters like # % ? & and raw spaces have
// caused intermittent upload failures in practice (they collide with URL-encoding on the
// storage/CDN side) — strip anything outside common safe characters before building an upload
// path, keeping the file extension intact.
export function sanitizeFileName(name: string): string {
  const dotIndex = name.lastIndexOf(".");
  const base = dotIndex > 0 ? name.slice(0, dotIndex) : name;
  const ext = dotIndex > 0 ? name.slice(dotIndex) : "";
  const safeBase = base.replace(/[^a-zA-Z0-9ก-๙_-]+/g, "-").replace(/-+/g, "-").slice(0, 80);
  return `${safeBase || "file"}${ext}`;
}
