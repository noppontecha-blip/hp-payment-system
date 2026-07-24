import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { formatThaiDate } from "@/lib/utils/thai-date";
import { formatNumber } from "@/lib/utils/format";
import { registerThaiFont } from "@/lib/pdf/thai-font";

// White/blue theme — a light blue accent (matching the app's navy sidebar) on structural
// elements (title bar, table header, box labels), body text stays dark for print legibility
// even on a grayscale office printer.
const BLUE = "#1d4ed8";
const BLUE_TINT = "#EAF2FE";
const BLUE_BORDER = "#B7D2F7";

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansThai",
    fontSize: 10,
    padding: 36,
    color: "#1a1a1a",
  },
  title: { fontSize: 16, fontWeight: "bold", color: BLUE },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: `2pt solid ${BLUE}`,
  },
  headerMeta: { textAlign: "right" },
  partiesRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  box: { border: `1pt solid ${BLUE_BORDER}`, borderRadius: 4, padding: 8, flex: 1 },
  boxLabel: { fontWeight: "bold", marginBottom: 4, color: BLUE },
  row: { flexDirection: "row", marginBottom: 2 },
  label: { width: 80 },
  value: { flex: 1 },
  table: { marginTop: 6, border: `1pt solid ${BLUE_BORDER}`, borderRadius: 4 },
  tr: { flexDirection: "row", borderBottom: `1pt solid ${BLUE_BORDER}` },
  th: {
    padding: 4,
    fontWeight: "bold",
    borderRight: `1pt solid ${BLUE_BORDER}`,
    textAlign: "center",
    backgroundColor: BLUE_TINT,
    color: BLUE,
  },
  td: { padding: 4, borderRight: `1pt solid ${BLUE_BORDER}` },
  tdNum: { padding: 4, borderRight: `1pt solid ${BLUE_BORDER}`, textAlign: "right" },
  totalsBox: { marginTop: 8, alignSelf: "flex-end", width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  totalsRowBold: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTop: `1pt solid ${BLUE}`,
    marginTop: 2,
    paddingTop: 2,
    fontWeight: "bold",
    color: BLUE,
  },
  section: { marginTop: 12 },
  sectionTitle: { fontWeight: "bold", marginBottom: 4, color: BLUE },
  footer: { marginTop: 24, flexDirection: "row", justifyContent: "space-between" },
  signBox: { width: 180, textAlign: "center" },
  signLine: { marginTop: 36, borderTop: "1pt solid #333", paddingTop: 4 },
  cancelStamp: {
    position: "absolute",
    top: 40,
    right: 30,
    color: "#dc2626",
    fontSize: 28,
    fontWeight: "bold",
    border: "3pt solid #dc2626",
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 14,
    transform: "rotate(-14deg)",
    opacity: 0.85,
  },
});

export type BillDocumentData = {
  hpNumber: string;
  transactionDate: string;
  documentNumber: string | null;
  company: { company_name: string; tax_id: string | null; registered_address: string | null };
  vendor: { name: string; code: string | null; tax_id: string | null; address: string | null };
  lines: {
    description: string;
    accountLabel: string;
    vehicleLabel: string;
    amountBeforeVat: number;
    vatAmount: number;
  }[];
  totals: { beforeVat: number; vat: number; wht: number; net: number };
  requiresWht: boolean;
  payments: { payment_date: string; amount: number; payment_method: string | null; notes: string | null }[];
  headerPaymentMethod: string | null;
  headerPaymentDate: string | null;
  notes: string | null;
  isCancelled: boolean;
};

export function BillDocument({ data }: { data: BillDocumentData }) {
  registerThaiFont();
  const paidSoFar = data.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = data.totals.net - paidSoFar;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {data.isCancelled && <Text style={styles.cancelStamp}>ยกเลิก</Text>}
        <View style={styles.headerRow}>
          <Text style={styles.title}>บันทึกค่าใช้จ่าย</Text>
          <View style={styles.headerMeta}>
            <Text>เลขที่เอกสาร: {data.hpNumber}</Text>
            <Text>วันที่: {formatThaiDate(data.transactionDate)}</Text>
            {data.documentNumber && <Text>อ้างอิงเอกสาร: {data.documentNumber}</Text>}
          </View>
        </View>

        <View style={styles.partiesRow}>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>ผู้ซื้อ</Text>
            <View style={styles.row}>
              <Text style={styles.label}>ชื่อ</Text>
              <Text style={styles.value}>{data.company.company_name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>เลขผู้เสียภาษี</Text>
              <Text style={styles.value}>{data.company.tax_id || "-"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>ที่อยู่</Text>
              <Text style={styles.value}>{data.company.registered_address || "-"}</Text>
            </View>
          </View>
          <View style={styles.box}>
            <Text style={styles.boxLabel}>ผู้ขาย</Text>
            <View style={styles.row}>
              <Text style={styles.label}>ชื่อ</Text>
              <Text style={styles.value}>{data.vendor.name}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>รหัส</Text>
              <Text style={styles.value}>{data.vendor.code || "-"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>เลขผู้เสียภาษี</Text>
              <Text style={styles.value}>{data.vendor.tax_id || "-"}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>ที่อยู่</Text>
              <Text style={styles.value}>{data.vendor.address || "-"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={[styles.th, { flex: 3 }]}>รายละเอียด</Text>
            <Text style={[styles.th, { flex: 2 }]}>รหัสบัญชี</Text>
            <Text style={[styles.th, { flex: 2 }]}>รถ/เครน</Text>
            <Text style={[styles.th, { flex: 1.5 }]}>มูลค่าก่อนภาษี</Text>
            <Text style={[styles.th, { flex: 1, borderRight: 0 }]}>VAT</Text>
          </View>
          {data.lines.map((line, i) => (
            <View style={styles.tr} key={i}>
              <Text style={[styles.td, { flex: 3 }]}>{line.description}</Text>
              <Text style={[styles.td, { flex: 2 }]}>{line.accountLabel || "-"}</Text>
              <Text style={[styles.td, { flex: 2 }]}>{line.vehicleLabel || "-"}</Text>
              <Text style={[styles.tdNum, { flex: 1.5 }]}>{formatNumber(line.amountBeforeVat)}</Text>
              <Text style={[styles.tdNum, { flex: 1, borderRight: 0 }]}>{formatNumber(line.vatAmount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text>รวมก่อน VAT</Text>
            <Text>{formatNumber(data.totals.beforeVat)}</Text>
          </View>
          <View style={styles.totalsRow}>
            <Text>VAT รวม</Text>
            <Text>{formatNumber(data.totals.vat)}</Text>
          </View>
          {data.requiresWht && (
            <View style={styles.totalsRow}>
              <Text>ภาษีหัก ณ ที่จ่าย</Text>
              <Text>-{formatNumber(data.totals.wht)}</Text>
            </View>
          )}
          <View style={styles.totalsRowBold}>
            <Text>จำนวนเงินสุทธิ</Text>
            <Text>{formatNumber(data.totals.net)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>การชำระเงิน</Text>
          {data.payments.length > 0 ? (
            <>
              <View style={styles.table}>
                <View style={styles.tr}>
                  <Text style={[styles.th, { flex: 1 }]}>วันที่</Text>
                  <Text style={[styles.th, { flex: 1.5 }]}>วิธีจ่าย</Text>
                  <Text style={[styles.th, { flex: 1 }]}>จำนวนเงิน</Text>
                  <Text style={[styles.th, { flex: 2, borderRight: 0 }]}>หมายเหตุ</Text>
                </View>
                {data.payments.map((p, i) => (
                  <View style={styles.tr} key={i}>
                    <Text style={[styles.td, { flex: 1 }]}>{formatThaiDate(p.payment_date)}</Text>
                    <Text style={[styles.td, { flex: 1.5 }]}>{p.payment_method || "-"}</Text>
                    <Text style={[styles.tdNum, { flex: 1 }]}>{formatNumber(p.amount)}</Text>
                    <Text style={[styles.td, { flex: 2, borderRight: 0 }]}>{p.notes || "-"}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.totalsBox}>
                <View style={styles.totalsRow}>
                  <Text>ชำระแล้ว</Text>
                  <Text>{formatNumber(paidSoFar)}</Text>
                </View>
                <View style={styles.totalsRowBold}>
                  <Text>คงเหลือ</Text>
                  <Text>{formatNumber(remaining)}</Text>
                </View>
              </View>
            </>
          ) : (
            <View style={styles.row}>
              <Text style={styles.label}>วิธีจ่าย</Text>
              <Text style={styles.value}>{data.headerPaymentMethod || "ยังไม่ระบุ"}</Text>
              <Text style={styles.label}>วันที่จ่าย</Text>
              <Text style={styles.value}>
                {data.headerPaymentDate ? formatThaiDate(data.headerPaymentDate) : "ยังไม่ระบุ"}
              </Text>
            </View>
          )}
        </View>

        {data.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>หมายเหตุ</Text>
            <Text>{data.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={styles.signBox}>
            <Text style={styles.signLine}>ผู้บันทึก</Text>
          </View>
          <View style={styles.signBox}>
            <Text style={styles.signLine}>ผู้อนุมัติ</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
