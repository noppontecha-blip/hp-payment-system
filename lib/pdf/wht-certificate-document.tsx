import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { formatThaiDate } from "@/lib/utils/thai-date";
import { formatNumber } from "@/lib/utils/format";
import { bahtText } from "@/lib/utils/baht-text";
import { registerThaiFont } from "@/lib/pdf/thai-font";

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
  title: { fontSize: 16, fontWeight: "bold", textAlign: "center", color: BLUE },
  subtitle: { fontSize: 10, textAlign: "center", marginBottom: 14 },
  box: { border: `1pt solid ${BLUE_BORDER}`, borderRadius: 4, padding: 8, marginBottom: 10 },
  boxLabel: { fontWeight: "bold", marginBottom: 4, color: BLUE },
  row: { flexDirection: "row", marginBottom: 2 },
  label: { width: 110 },
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
  tdLast: { padding: 4 },
  tdNum: { padding: 4, borderRight: `1pt solid ${BLUE_BORDER}`, textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    borderTop: `1pt solid ${BLUE}`,
    backgroundColor: BLUE_TINT,
    fontWeight: "bold",
    color: BLUE,
  },
  footer: { marginTop: 24, flexDirection: "row", justifyContent: "space-between" },
  signBox: { width: 200, textAlign: "center" },
  signLine: { marginTop: 36, borderTop: "1pt solid #333", paddingTop: 4 },
});

export type WhtCertificateData = {
  hpNumber: string;
  paymentDate: string | null;
  incomeTypeLabel: string;
  amountBeforeVat: number;
  whtRatePct: number | null;
  whtAmount: number;
  company: {
    company_name: string;
    tax_id: string | null;
    branch: string | null;
    registered_address: string | null;
    authorized_signer_name: string | null;
  };
  vendor: {
    name: string;
    tax_id: string | null;
    vendor_type: string | null;
    registered_address: string | null;
  };
};

export function WhtCertificateDocument({ data }: { data: WhtCertificateData }) {
  registerThaiFont();
  const idLabel = data.vendor.vendor_type === "บุคคลธรรมดา" ? "เลขบัตรประชาชน" : "เลขประจำตัวผู้เสียภาษี";

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>หนังสือรับรองการหักภาษี ณ ที่จ่าย</Text>
        <Text style={styles.subtitle}>ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร · เลขที่บิล {data.hpNumber}</Text>

        <View style={styles.box}>
          <Text style={styles.boxLabel}>ผู้มีหน้าที่หักภาษี ณ ที่จ่าย (ผู้จ่ายเงิน)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>ชื่อ</Text>
            <Text style={styles.value}>{data.company.company_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>เลขประจำตัวผู้เสียภาษี</Text>
            <Text style={styles.value}>{data.company.tax_id || "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>สาขา</Text>
            <Text style={styles.value}>{data.company.branch || "สำนักงานใหญ่"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>ที่อยู่</Text>
            <Text style={styles.value}>{data.company.registered_address || "-"}</Text>
          </View>
        </View>

        <View style={styles.box}>
          <Text style={styles.boxLabel}>ผู้ถูกหักภาษี ณ ที่จ่าย (ผู้รับเงิน)</Text>
          <View style={styles.row}>
            <Text style={styles.label}>ชื่อ</Text>
            <Text style={styles.value}>{data.vendor.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{idLabel}</Text>
            <Text style={styles.value}>{data.vendor.tax_id || "-"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>ที่อยู่</Text>
            <Text style={styles.value}>{data.vendor.registered_address || "-"}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tr}>
            <Text style={[styles.th, { width: 140 }]}>ประเภทเงินได้พึงประเมิน</Text>
            <Text style={[styles.th, { width: 80 }]}>วันที่จ่าย</Text>
            <Text style={[styles.th, { width: 100 }]}>จำนวนเงินที่จ่าย</Text>
            <Text style={[styles.th, { width: 50 }]}>อัตรา</Text>
            <Text style={[styles.th, { width: 100, borderRight: 0 }]}>ภาษีที่หักและนำส่ง</Text>
          </View>
          <View style={styles.tr}>
            <Text style={[styles.td, { width: 140 }]}>{data.incomeTypeLabel}</Text>
            <Text style={[styles.td, { width: 80 }]}>{formatThaiDate(data.paymentDate)}</Text>
            <Text style={[styles.tdNum, { width: 100 }]}>{formatNumber(data.amountBeforeVat)}</Text>
            <Text style={[styles.td, { width: 50, textAlign: "center" }]}>
              {data.whtRatePct != null ? `${data.whtRatePct}%` : "-"}
            </Text>
            <Text style={[styles.tdNum, { width: 100, borderRight: 0 }]}>{formatNumber(data.whtAmount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.td, { width: 220 }]}>รวมเงินที่จ่ายและภาษีที่หักนำส่ง</Text>
            <Text style={[styles.tdNum, { width: 100 }]}>{formatNumber(data.amountBeforeVat)}</Text>
            <Text style={[styles.td, { width: 50 }]} />
            <Text style={[styles.tdNum, { width: 100, borderRight: 0 }]}>{formatNumber(data.whtAmount)}</Text>
          </View>
        </View>

        <Text style={{ marginTop: 8 }}>
          (จำนวนเงินภาษีที่หักนำส่งทั้งสิ้น {bahtText(data.whtAmount)})
        </Text>

        <View style={styles.footer}>
          <View style={styles.signBox}>
            <Text style={styles.signLine}>ผู้จ่ายเงิน</Text>
            <Text>{data.company.authorized_signer_name || ""}</Text>
          </View>
          <View style={styles.signBox}>
            <Text style={styles.signLine}>วันที่ออกหนังสือรับรอง</Text>
            <Text>{formatThaiDate(new Date().toISOString().slice(0, 10))}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
