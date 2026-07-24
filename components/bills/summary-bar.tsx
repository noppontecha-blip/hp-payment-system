import { formatCurrency } from "@/lib/utils/format";

export function SummaryBar({
  beforeVat,
  vat,
  wht,
  net,
}: {
  beforeVat: number;
  vat: number;
  wht: number;
  net: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-x-8 gap-y-2 rounded-xl border border-border bg-card px-5 py-3 shadow-sm">
      <div className="text-sm text-muted-foreground">
        รวมก่อน VAT <span className="ml-1.5 font-mono font-medium text-ink">{formatCurrency(beforeVat)}</span>
      </div>
      <div className="text-sm text-muted-foreground">
        รวม VAT <span className="ml-1.5 font-mono font-medium text-ink">{formatCurrency(vat)}</span>
      </div>
      {wht > 0 && (
        <div className="text-sm text-warn">
          หัก ณ ที่จ่าย <span className="ml-1.5 font-mono font-medium">-{formatCurrency(wht)}</span>
        </div>
      )}
      <div className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2 text-white">
        <span className="text-xs text-white/80">ยอดจ่ายสุทธิ</span>
        <span className="text-xl font-bold">{formatCurrency(net)}</span>
      </div>
    </div>
  );
}
