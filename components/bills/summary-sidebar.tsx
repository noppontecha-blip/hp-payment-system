import { formatCurrency } from "@/lib/utils/format";

export function SummarySidebar({
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
    <div className="sticky top-6 space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm">
      <p className="text-sm font-medium text-ink">สรุปยอด</p>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between text-muted-foreground">
          <span>รวมก่อน VAT</span>
          <span>{formatCurrency(beforeVat)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>รวม VAT</span>
          <span>{formatCurrency(vat)}</span>
        </div>
        {wht > 0 && (
          <div className="flex justify-between text-warn">
            <span>รวมยอดหัก ณ ที่จ่าย</span>
            <span>-{formatCurrency(wht)}</span>
          </div>
        )}
      </div>
      <div className="border-t border-border pt-3">
        <p className="text-xs text-muted-foreground">ยอดจ่ายสุทธิ</p>
        <p className="text-2xl font-bold text-ink">{formatCurrency(net)}</p>
      </div>
    </div>
  );
}
