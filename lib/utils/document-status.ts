export type DocumentStatus =
  | "ร่างเอกสาร"
  | "ยกเลิก"
  | "รอชำระ"
  | "ชำระแล้ว/เอกสารยังไม่ครบ"
  | "ชำระแล้ว/เอกสารครบ";

// Replaces the old fake draft/final split — is_draft/is_cancelled are real, persisted flags
// (see hp_payment_lines migration 0033); "paid" and "document received" are derived from
// existing data rather than another stored flag.
export function deriveDocumentStatus({
  isDraft,
  isCancelled,
  documentType,
  netTotal,
  paidTotal,
}: {
  isDraft: boolean;
  isCancelled: boolean;
  documentType: string;
  netTotal: number;
  paidTotal: number;
}): DocumentStatus {
  if (isCancelled) return "ยกเลิก";
  if (isDraft) return "ร่างเอกสาร";
  const isPaid = netTotal > 0 && paidTotal >= netTotal;
  if (!isPaid) return "รอชำระ";
  return documentType === "ยังไม่มีเอกสาร" ? "ชำระแล้ว/เอกสารยังไม่ครบ" : "ชำระแล้ว/เอกสารครบ";
}

export function documentStatusTone(status: DocumentStatus): "success" | "info" | "warn" | "danger" {
  switch (status) {
    case "ยกเลิก":
      return "danger";
    case "ร่างเอกสาร":
      return "info";
    case "รอชำระ":
    case "ชำระแล้ว/เอกสารยังไม่ครบ":
      return "warn";
    case "ชำระแล้ว/เอกสารครบ":
      return "success";
  }
}

export type PurchaseDocLabel = "ขาดใบกำกับภาษี" | "ขาดใบเสร็จรับเงิน" | "ขาดเอกสาร" | "เอกสารครบแล้ว";

// สถานะเอกสารซื้อ 3 แบบที่หน้าติดตามใช้แสดง — ต่างจาก deriveDocumentStatus ข้างบนซึ่งเป็นสถานะรวม
// ทั้งบิล (รวมการจ่ายเงิน/ยกเลิกด้วย) อันนี้สนใจแค่แง่มุมเดียวคือเอกสารซื้อขาด/ครบ
export function derivePurchaseDocLabel({
  documentType,
  expectedDocumentType,
}: {
  documentType: string;
  expectedDocumentType: string | null;
}): PurchaseDocLabel {
  if (documentType !== "ยังไม่มีเอกสาร") return "เอกสารครบแล้ว";
  if (expectedDocumentType === "ใบกำกับภาษี") return "ขาดใบกำกับภาษี";
  if (expectedDocumentType === "บิลเงินสด") return "ขาดใบเสร็จรับเงิน";
  return "ขาดเอกสาร";
}

export function purchaseDocLabelTone(label: PurchaseDocLabel): "success" | "info" | "warn" | "danger" {
  return label === "เอกสารครบแล้ว" ? "success" : "warn";
}
