import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { formatThaiDate } from "@/lib/utils/thai-date";
import { formatNumber } from "@/lib/utils/format";
import { bahtText } from "@/lib/utils/baht-text";
import { registerThaiFont } from "@/lib/pdf/thai-font";
import type { ExpenseDocumentData } from "@/lib/pdf/fetch-expense-document";

// Same white/blue theme as bill-document.tsx / payment-voucher-document.tsx.
const BLUE = "#1d4ed8";
const BLUE_TINT = "#EAF2FE";
const BLUE_BORDER = "#B7D2F7";

const styles = StyleSheet.create({
  page: {
    fontFamily: "NotoSansThai",
    fontSize: 12,
    padding: 36,
    color: "#1a1a1a",
  },
  title: { fontSize: 18, fontWeight: "bold", color: BLUE },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottom: `2pt solid ${BLUE}`,
  },
  headerMeta: { textAlign: "right" },
  box: {
    border: `1pt solid ${BLUE_BORDER}`,
    borderRadius: 4,
    padding: 8,
    marginBottom: 10,
    width: "50%",
  },
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
  tdCenter: { padding: 4, borderRight: `1pt solid ${BLUE_BORDER}`, textAlign: "center" },
  tdSub: { color: "#6b7280", fontSize: 10.5, marginTop: 1 },
  totalsBox: { marginTop: 8, alignSelf: "flex-end", width: 240 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 2 },
  totalsRowBold: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 3,
    backgroundColor: BLUE_TINT,
    fontWeight: "bold",
    color: BLUE,
  },
  trAlt: { backgroundColor: "#F7FAFE" },
  bahtLine: { marginTop: 6, textAlign: "right", color: "#6b7280" },
  certification: {
    marginTop: 16,
    padding: 10,
    border: `1pt solid ${BLUE_BORDER}`,
    borderRadius: 4,
    backgroundColor: BLUE_TINT,
    lineHeight: 1.5,
  },
  footer: { marginTop: 28, flexDirection: "row", justifyContent: "space-between" },
  signBox: { width: 200, textAlign: "center" },
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

export function ReceiptSubstituteDocument({ data }: { data: ExpenseDocumentData }) {
  registerThaiFont();
  const signerName = data.company.authorized_signer_name || "-";
  const branchLabel = data.company.branch || "สำนักงานใหญ่";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {data.isCancelled && <Text style={styles.cancelStamp}>ยกเลิก</Text>}
        <View style={styles.headerRow}>
          <Text style={styles.title}>ใบรับรองแทนใบเสร็จรับเงิน</Text>
          <View style={styles.headerMeta}>
            <Text>เลขที่เอกสาร: {data.hpNumber}</Text>
            <Text>วันที่ออก: {formatThaiDate(data.transactionDate)}</Text>
            {data.documentNumber && <Text>อ้างอิง: {data.documentNumber}</Text>}
          </View>
        </View>

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

        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={[styles.th, { width: 26 }]}>ลำดับ</Text>
            <Text style={[styles.th, { flex: 3 }]}>บัญชี / รายละเอียด</Text>
            <Text style={[styles.th, { flex: 1 }]}>จำนวน</Text>
            <Text style={[styles.th, { flex: 1.2 }]}>ราคา/หน่วย</Text>
            <Text style={[styles.th, { flex: 1.4 }]}>มูลค่าก่อนภาษี</Text>
            <Text style={[styles.th, { flex: 1, borderRight: 0 }]}>VAT</Text>
          </View>
          {data.lines.map((line, i) => (
            <View style={i % 2 === 1 ? { ...styles.tr, ...styles.trAlt } : styles.tr} key={line.seq}>
              <Text style={[styles.tdCenter, { width: 26 }]}>{line.seq}</Text>
              <View style={[styles.td, { flex: 3 }]}>
                <Text>{line.accountCode || "-"}</Text>
                <Text style={styles.tdSub}>{line.description}</Text>
              </View>
              <Text style={[styles.tdNum, { flex: 1 }]}>{formatNumber(line.quantity)}</Text>
              <Text style={[styles.tdNum, { flex: 1.2 }]}>{formatNumber(line.unitPrice)}</Text>
              <Text style={[styles.tdNum, { flex: 1.4 }]}>{formatNumber(line.amountBeforeVat)}</Text>
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
          <View style={styles.totalsRowBold}>
            <Text>จำนวนเงินทั้งสิ้น</Text>
            <Text>{formatNumber(data.totals.net)}</Text>
          </View>
        </View>
        <Text style={styles.bahtLine}>({bahtText(data.totals.net)})</Text>

        {data.notes && (
          <View style={{ marginTop: 10 }}>
            <Text style={styles.boxLabel}>หมายเหตุ</Text>
            <Text>{data.notes}</Text>
          </View>
        )}

        <View style={styles.certification}>
          <Text>
            ข้าพเจ้า {signerName} ขอรับรองว่า รายจ่ายข้างต้นนี้ข้าพเจ้าไม่สามารถเรียกเก็บใบเสร็จรับเงินจาก
            ผู้ขายได้ และข้าพเจ้าได้จ่ายเงินไปในนามบริษัทฯ {data.company.company_name} ({branchLabel})
            โดยแท้จริง
          </Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.signBox}>
            <Text style={styles.signLine}>ผู้เบิกจ่าย</Text>
          </View>
          <View style={styles.signBox}>
            <Text style={styles.signLine}>ผู้อนุมัติ</Text>
            <Text>{data.company.authorized_signer_name || ""}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
