import { Header } from "@/components/layout/header";
import { createClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: lines }, { data: summary }, { data: accounts }] = await Promise.all([
    supabase.from("hp_payment_lines").select("*").order("transaction_date", { ascending: false }),
    supabase.from("hp_voucher_summary").select("*"),
    supabase.from("chart_of_accounts").select("*"),
  ]);

  const allLines = lines ?? [];
  const allVouchers = summary ?? [];
  const accountsById = new Map((accounts ?? []).map((a) => [a.id, a.name]));

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  const billsThisMonth = allVouchers.filter((v) => {
    const d = new Date(v.first_date);
    return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  }).length;
  const billsThisYear = allVouchers.filter((v) => new Date(v.first_date).getFullYear() === currentYear).length;

  const netPaidThisYear = allLines
    .filter((l) => new Date(l.transaction_date).getFullYear() === currentYear)
    .reduce((sum, l) => sum + l.net_paid_amount, 0);

  const pendingDocCount = allVouchers.filter((v) => v.doc_pending).length;
  const whtTotalThisYear = allLines
    .filter((l) => l.requires_wht && new Date(l.transaction_date).getFullYear() === currentYear)
    .reduce((sum, l) => sum + (l.wht_amount ?? 0), 0);

  const monthlyBuckets = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    monthlyBuckets.set(key, 0);
  }
  for (const line of allLines) {
    const d = new Date(line.transaction_date);
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (monthlyBuckets.has(key)) {
      monthlyBuckets.set(key, (monthlyBuckets.get(key) ?? 0) + line.net_paid_amount);
    }
  }
  const monthlySeries = Array.from(monthlyBuckets.entries()).map(([key, total]) => {
    const [year, month] = key.split("-").map(Number);
    const beYear = (year + 543) % 100;
    return { month: `${THAI_MONTHS_SHORT[month]}${beYear}`, total: Math.round(total) };
  });

  const categoryTotals = new Map<string, number>();
  for (const line of allLines) {
    const name = line.account_code_id ? (accountsById.get(line.account_code_id) ?? "ไม่ระบุ") : "ไม่ระบุ";
    categoryTotals.set(name, (categoryTotals.get(name) ?? 0) + line.net_paid_amount);
  }
  const sortedCategories = Array.from(categoryTotals.entries())
    .map(([name, total]) => ({ name, total: Math.round(total) }))
    .sort((a, b) => b.total - a.total);
  const topCategories = sortedCategories.slice(0, 6);
  const otherTotal = sortedCategories.slice(6).reduce((sum, c) => sum + c.total, 0);
  const categorySeries = otherTotal > 0 ? [...topCategories, { name: "อื่นๆ", total: otherTotal }] : topCategories;

  const recentLines = allLines.slice(0, 10);

  return (
    <>
      <Header
        eyebrow="ภาพรวม"
        title="Dashboard"
        subtitle="ภาพรวมบิลจ่าย HP"
        metaChip={`บิลปีนี้ ${billsThisYear} บิล`}
        hasNotification={pendingDocCount > 0}
      />
      <DashboardClient
        billsThisMonth={billsThisMonth}
        billsThisYear={billsThisYear}
        netPaidThisYear={netPaidThisYear}
        pendingDocCount={pendingDocCount}
        whtTotalThisYear={whtTotalThisYear}
        monthlySeries={monthlySeries}
        categorySeries={categorySeries}
        recentLines={recentLines}
      />
    </>
  );
}
