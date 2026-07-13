const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");

const SRC = "E:/desktop/_ _ _ _ SPK _ _ _ _/_ClaudeCowork/10 Accounting/บัญชีคุมบิลจ่าย SPK Crane (จัดระเบียบใหม่).xlsx";
const OUT = path.join(__dirname, "june-2569-source.json");

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(SRC);
  const ws = wb.getWorksheet("บัญชีคุมบิลจ่าย (HP)");
  const headers = [];
  for (let i = 1; i <= 28; i++) headers.push(ws.getRow(3).getCell(i).value);

  const results = [];
  for (let r = 4; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    if (row.getCell(2).value == null) continue;
    const d = row.getCell(3).value;
    if (d instanceof Date && d.getUTCFullYear() === 2026 && d.getUTCMonth() + 1 === 6) {
      const obj = {};
      headers.forEach((h, i) => {
        let v = row.getCell(i + 1).value;
        if (v instanceof Date) v = v.toISOString().slice(0, 10);
        if (v && typeof v === "object" && "text" in v) v = v.text;
        obj[h] = v ?? null;
      });
      results.push(obj);
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(results, null, 2), "utf8");
  console.log(`Wrote ${results.length} rows to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
