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
