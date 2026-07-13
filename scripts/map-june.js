const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const SRC = path.join(__dirname, "june-2569-source.json");
const OUT = path.join(__dirname, "june-2569-mapped.json");
const REPORT = path.join(__dirname, "june-2569-report.txt");

const BLANK_TOKENS = new Set(["-", "ไม่มี", "", null, undefined]);

function norm(v) {
  if (v == null) return null;
  const s = String(v).trim();
  if (BLANK_TOKENS.has(s)) return null;
  return s;
}

// Legacy sheet mixes real ISO (AD) dates already converted by the extractor with a few
// raw "2569-06-01" (Buddhist-era year) strings from cells that weren't stored as Excel dates.
function normDate(v) {
  const s = norm(v);
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  let year = Number(m[1]);
  if (year > 2400) year -= 543; // Buddhist Era -> Gregorian
  return `${year}-${m[2]}-${m[3]}`;
}

function parseWhtRate(v) {
  const s = norm(v);
  if (!s) return null;
  const m = s.match(/[\d.]+/);
  return m ? Number(m[0]) : null;
}

function stripAccountCode(description) {
  const s = norm(description) ?? "";
  const m = s.match(/^(\d{6})-?(.*)$/);
  if (m) return { code: m[1], rest: m[2].trim() || s };
  return { code: null, rest: s };
}

function extractVehicleCodes(description) {
  const s = norm(description) ?? "";
  const matches = s.match(/C\d{1,3}/g);
  if (!matches) return null;
  return Array.from(new Set(matches)).join(", ");
}

// Best-effort short name for a new chart_of_accounts row from the raw description fragment
// that follows the code prefix, e.g. "ค่าน้ำประปา4/9 ด.6/69 (24019ถึง24396 ใช้377หน่วย)" -> "ค่าน้ำประปา".
function deriveAccountName(raw) {
  const s = (raw || "").split("/")[0].trim();
  const capped = s.length > 60 ? `${s.slice(0, 60)}…` : s;
  return capped || "(ไม่ระบุชื่อบัญชี)";
}

async function main() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) throw new Error("Set SUPABASE_DB_PASSWORD env var first");

  const client = new Client({
    connectionString: `postgresql://postgres.bzcwdgvpfflpsbpqhikr:${password}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
  });
  await client.connect();

  const [{ rows: vendors }, { rows: accounts }, { rows: whtCategories }, { rows: existing }] = await Promise.all([
    client.query("select id, name from vendors"),
    client.query("select id, code from chart_of_accounts"),
    client.query("select id, name from wht_categories"),
    client.query("select distinct hp_number from hp_payment_lines where hp_number like 'HP6906%'"),
  ]);
  await client.end();

  const vendorByName = new Map(vendors.map((v) => [v.name.trim(), v.id]));
  const accountByCode = new Map(accounts.map((a) => [a.code.trim(), a.id]));
  const whtCategoryByName = new Map(whtCategories.map((c) => [c.name.trim(), c.id]));
  const existingHpNumbers = new Set(existing.map((r) => r.hp_number));

  const source = JSON.parse(fs.readFileSync(SRC, "utf8"));

  const mapped = [];
  const issues = [];
  let unmatchedVendor = 0;
  let unmatchedAccount = 0;
  let unmatchedWhtCategory = 0;

  const vendorsToCreate = new Map(); // name -> { code, name }
  const accountsToCreate = new Map(); // code -> { code, name, legacy_note }
  let nextVendorSeq = vendors.length + 1;

  for (const row of source) {
    const hp_number = norm(row["เลขบิลจ่าย(HP)"]);
    const transaction_date = normDate(row["วันที่"]);
    const vendorNameRaw = norm(row["ชื่อผู้จำหน่าย"]) ?? "ไม่ระบุ";
    let vendor_id = vendorByName.get(vendorNameRaw) ?? null;
    if (!vendor_id) {
      unmatchedVendor++;
      if (!vendorsToCreate.has(vendorNameRaw)) {
        vendorsToCreate.set(vendorNameRaw, { code: `V${String(nextVendorSeq++).padStart(2, "0")}`, name: vendorNameRaw });
      }
    }

    const { code, rest } = stripAccountCode(row["รายละเอียด"]);
    let account_code_id = code ? (accountByCode.get(code) ?? null) : null;
    if (code && !account_code_id) {
      unmatchedAccount++;
      if (!accountsToCreate.has(code)) {
        accountsToCreate.set(code, {
          code,
          name: deriveAccountName(rest),
          legacy_note: `นำเข้าจากไฟล์ Excel เดิม, ตัวอย่างข้อความเดิม: "${rest}"`,
        });
      }
    }

    const taxInvoice = norm(row["เลขใบกำกับภาษี"]);
    const billNo = norm(row["เลขที่บิล"]);
    let document_type = "ยังไม่มีเอกสาร";
    let document_number = null;
    let document_invoice_date = null;
    if (taxInvoice) {
      document_type = "ใบกำกับภาษี";
      document_number = taxInvoice;
      document_invoice_date = transaction_date;
    } else if (billNo) {
      document_type = "บิลเงินสด";
      document_number = billNo;
    }

    const whtRate = parseWhtRate(row["หัก %"]);
    const whtAmount = Number(row["ยอดหัก ณ ที่จ่าย"]) || 0;
    const requires_wht = whtAmount > 0 || (whtRate ?? 0) > 0;
    let wht_category_id = null;
    if (requires_wht) {
      const catRaw = norm(row["ค่าอะไร(ประเภทหัก)"]) ?? "";
      const KEYWORD_MAP = [
        [/นายหน้า/, "ค่านายหน้า"],
        [/ประกัน/, "ค่าเบี้ยประกันภัย/ค่านายหน้าประกัน"],
        [/บริการ|จ้าง/, "ค่าบริการ/ค่าจ้างทำของ"],
        [/เช่า/, "ค่าเช่า"],
        [/โฆษณา/, "ค่าโฆษณา"],
        [/ขนส่ง/, "ค่าขนส่ง"],
        [/ดอกเบี้ย/, "ดอกเบี้ย"],
      ];
      for (const [re, catName] of KEYWORD_MAP) {
        if (re.test(catRaw) && whtCategoryByName.has(catName)) {
          wht_category_id = whtCategoryByName.get(catName);
          break;
        }
      }
      if (!wht_category_id) unmatchedWhtCategory++;
    }

    const advancePayer = norm(row["ผู้สำรองจ่าย"]);
    const payment_method = advancePayer ? "สำรองจ่าย" : "บัญชีธนาคารบริษัท";
    const payment_date = normDate(row["วันที่ SPK จ่ายคืน"]);
    const spk_repaid_date = payment_method === "สำรองจ่าย" ? payment_date : null;

    const noteParts = [];
    const bankName = norm(row["จ่ายโดย(ธนาคาร)"]);
    if (bankName) noteParts.push(`จ่ายโดย: ${bankName}`);
    const paidAccount = norm(row["บัญชีที่จ่าย"]);
    if (paidAccount) noteParts.push(`บัญชีที่จ่าย(เดิม): ${paidAccount}`);
    const branch = norm(row["สถานะ/สาขา (ต้นฉบับ)"]);
    if (branch) noteParts.push(`สถานะ/สาขา(เดิม): ${branch}`);
    const advancePaidDate = normDate(row["วันที่สำรองจ่าย"]);
    if (advancePaidDate) noteParts.push(`วันที่สำรองจ่าย(เดิม): ${advancePaidDate}`);
    const oldDocStatus = norm(row["เอกสารจากสนง.บัญชี"]);
    if (oldDocStatus === "รอเอกสารจากสนง.บัญชี") noteParts.push("รอเอกสารจากสนง.บัญชี(เดิม)");
    const originalNote = norm(row["หมายเหตุ"]);
    if (originalNote) noteParts.push(originalNote);
    noteParts.push("[นำเข้าจากไฟล์ Excel เดิม]");

    const mappedRow = {
      hp_number,
      transaction_date,
      work_type: norm(row["ประเภทงาน"]) ?? "ปกติ",
      asset_construction_detail: norm(row["รายละเอียดงานสร้าง(ถ้ามี)"]),
      special_category: norm(row["หมวดพิเศษ"]),
      document_type,
      document_number,
      document_invoice_date,
      vendor_id: vendor_id ?? `__NEW_VENDOR__:${vendorNameRaw}`,
      vendor_name_snapshot: vendorNameRaw,
      description: rest,
      account_code_id: account_code_id ?? (code ? `__NEW_ACCOUNT__:${code}` : null),
      vehicle_id: null,
      related_vehicles_text: extractVehicleCodes(row["รายละเอียด"]),
      amount_before_vat: Number(row["ก่อน VAT"]) || 0,
      vat_amount: Number(row["VAT 7%"]) || 0,
      requires_wht,
      wht_category_id,
      wht_rate_pct: requires_wht ? whtRate : null,
      wht_payee_name: requires_wht ? norm(row["ชื่อในใบหัก ณ ที่จ่าย"]) : null,
      wht_amount: requires_wht ? whtAmount : null,
      wht_issue_date: normDate(row["วันที่ออกหัก"]),
      net_paid_amount: Number(row["ยอดจ่ายสุทธิ"]) || 0,
      payment_method,
      payment_date,
      advance_payer_name: advancePayer,
      spk_repaid_date,
      notes: noteParts.join(" | "),
      recorded_by: norm(row["บันทึกโดย"]),
    };

    if (!hp_number || !transaction_date) {
      issues.push(`Row skipped (missing hp_number/date): ${JSON.stringify(row).slice(0, 120)}`);
      continue;
    }
    if (existingHpNumbers.has(hp_number)) {
      issues.push(`HP number already exists in DB, will skip on insert: ${hp_number}`);
    }

    mapped.push(mappedRow);
  }

  fs.writeFileSync(OUT, JSON.stringify(mapped, null, 2), "utf8");
  fs.writeFileSync(
    path.join(__dirname, "june-2569-vendors-to-create.json"),
    JSON.stringify([...vendorsToCreate.values()], null, 2),
    "utf8",
  );
  fs.writeFileSync(
    path.join(__dirname, "june-2569-accounts-to-create.json"),
    JSON.stringify([...accountsToCreate.values()], null, 2),
    "utf8",
  );

  const report = [
    `Total source rows: ${source.length}`,
    `Mapped rows: ${mapped.length}`,
    `New vendors to create: ${vendorsToCreate.size} (of ${unmatchedVendor} unmatched rows)`,
    `New account codes to create: ${accountsToCreate.size} (of ${unmatchedAccount} unmatched rows)`,
    `WHT category still unmatched after keyword mapping: ${unmatchedWhtCategory}`,
    `Already-existing HP numbers in DB (HP6906%): ${existingHpNumbers.size}`,
    "",
    "New vendors:",
    ...[...vendorsToCreate.values()].map((v) => `  ${v.code}  ${v.name}`),
    "",
    "New accounts:",
    ...[...accountsToCreate.values()].map((a) => `  ${a.code}  ${a.name}`),
    "",
    "Issues:",
    ...issues,
  ].join("\n");
  fs.writeFileSync(REPORT, report, "utf8");
  console.log(report);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
