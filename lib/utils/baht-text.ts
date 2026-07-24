// Thai Baht amount-in-words, used on the 50-ทวิ certificate ("จำนวนเงินภาษีที่หักนำส่งทั้งสิ้น").
const DIGIT_NAMES = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const PLACE_NAMES = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

function convertGroup(digits: string): string {
  let result = "";
  const len = digits.length;
  for (let i = 0; i < len; i++) {
    const digit = Number(digits[i]);
    const place = len - i - 1;
    if (digit === 0) continue;
    if (place === 0) {
      result += digit === 1 && len > 1 ? "เอ็ด" : DIGIT_NAMES[digit];
    } else if (place === 1) {
      result += digit === 1 ? "สิบ" : digit === 2 ? "ยี่สิบ" : DIGIT_NAMES[digit] + "สิบ";
    } else {
      result += DIGIT_NAMES[digit] + PLACE_NAMES[place];
    }
  }
  return result;
}

function numberToThaiWords(value: number): string {
  if (value === 0) return "ศูนย์";
  let digits = String(Math.trunc(value));
  const groups: string[] = [];
  while (digits.length > 0) {
    groups.unshift(digits.slice(-6));
    digits = digits.slice(0, -6);
  }
  return groups.map((g, i) => convertGroup(g) + (i < groups.length - 1 ? "ล้าน" : "")).join("");
}

export function bahtText(amount: number): string {
  const rounded = Math.round(Math.abs(amount) * 100) / 100;
  const baht = Math.trunc(rounded);
  const satang = Math.round((rounded - baht) * 100);
  const sign = amount < 0 ? "ลบ" : "";
  const bahtPart = `${numberToThaiWords(baht)}บาท`;
  const satangPart = satang === 0 ? "ถ้วน" : `${numberToThaiWords(satang)}สตางค์`;
  return sign + bahtPart + satangPart;
}
