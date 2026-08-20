// รวมที่อยู่แบบแยกฟิลด์ (เลขที่/หมู่ที่/หมู่บ้าน/ซอย/ถนน/ตำบล/อำเภอ/จังหวัด/รหัสไปรษณีย์) เป็นข้อความ
// เดียว — ใช้เก็บใน vendors.registered_address เพื่อให้โค้ดที่อ่านฟิลด์นี้อยู่แล้ว (bill-form.tsx,
// wht-certificate route, fetch-expense-document.ts) ยังทำงานได้โดยไม่ต้องแก้ไข
export function composeThaiAddress(parts: {
  address_number?: string | null;
  address_moo?: string | null;
  address_village?: string | null;
  address_soi?: string | null;
  address_road?: string | null;
  address_subdistrict?: string | null;
  address_district?: string | null;
  address_province?: string | null;
  address_postal_code?: string | null;
}): string {
  const segments: string[] = [];
  if (parts.address_number) segments.push(`เลขที่ ${parts.address_number}`);
  if (parts.address_moo) segments.push(`หมู่ที่ ${parts.address_moo}`);
  if (parts.address_village) segments.push(parts.address_village);
  if (parts.address_soi) segments.push(`ซอย${parts.address_soi}`);
  if (parts.address_road) segments.push(`ถนน${parts.address_road}`);
  if (parts.address_subdistrict) segments.push(`ตำบล/แขวง${parts.address_subdistrict}`);
  if (parts.address_district) segments.push(`อำเภอ/เขต${parts.address_district}`);
  if (parts.address_province) segments.push(`จังหวัด${parts.address_province}`);
  if (parts.address_postal_code) segments.push(parts.address_postal_code);
  return segments.join(" ");
}
