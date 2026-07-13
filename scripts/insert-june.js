const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

const MAPPED = path.join(__dirname, "june-2569-mapped.json");
const VENDORS_TO_CREATE = path.join(__dirname, "june-2569-vendors-to-create.json");
const ACCOUNTS_TO_CREATE = path.join(__dirname, "june-2569-accounts-to-create.json");

const HP_COLUMNS = [
  "hp_number", "transaction_date", "work_type", "asset_construction_detail", "special_category",
  "document_type", "document_number", "document_invoice_date",
  "vendor_id", "vendor_name_snapshot", "description", "account_code_id", "vehicle_id",
  "related_vehicles_text", "amount_before_vat", "vat_amount",
  "requires_wht", "wht_category_id", "wht_rate_pct", "wht_payee_name", "wht_amount", "wht_issue_date",
  "net_paid_amount", "payment_method", "payment_date", "advance_payer_name", "spk_repaid_date",
  "notes", "recorded_by",
];

async function main() {
  const password = process.env.SUPABASE_DB_PASSWORD;
  if (!password) throw new Error("Set SUPABASE_DB_PASSWORD env var first");

  const mapped = JSON.parse(fs.readFileSync(MAPPED, "utf8"));
  const vendorsToCreate = JSON.parse(fs.readFileSync(VENDORS_TO_CREATE, "utf8"));
  const accountsToCreate = JSON.parse(fs.readFileSync(ACCOUNTS_TO_CREATE, "utf8"));

  const client = new Client({
    connectionString: `postgresql://postgres.bzcwdgvpfflpsbpqhikr:${password}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
  });
  await client.connect();

  try {
    await client.query("BEGIN");

    const vendorIdByName = new Map();
    for (const v of vendorsToCreate) {
      const { rows } = await client.query(
        "insert into vendors (code, name) values ($1, $2) returning id",
        [v.code, v.name],
      );
      vendorIdByName.set(v.name, rows[0].id);
    }
    console.log(`Created ${vendorIdByName.size} vendors`);

    const accountIdByCode = new Map();
    for (const a of accountsToCreate) {
      const { rows } = await client.query(
        "insert into chart_of_accounts (code, name, legacy_note) values ($1, $2, $3) returning id",
        [a.code, a.name, a.legacy_note],
      );
      accountIdByCode.set(a.code, rows[0].id);
    }
    console.log(`Created ${accountIdByCode.size} chart_of_accounts rows`);

    let inserted = 0;
    for (const row of mapped) {
      const resolved = { ...row };
      if (typeof resolved.vendor_id === "string" && resolved.vendor_id.startsWith("__NEW_VENDOR__:")) {
        const name = resolved.vendor_id.slice("__NEW_VENDOR__:".length);
        resolved.vendor_id = vendorIdByName.get(name) ?? null;
      }
      if (typeof resolved.account_code_id === "string" && resolved.account_code_id.startsWith("__NEW_ACCOUNT__:")) {
        const code = resolved.account_code_id.slice("__NEW_ACCOUNT__:".length);
        resolved.account_code_id = accountIdByCode.get(code) ?? null;
      }

      const values = HP_COLUMNS.map((c) => resolved[c] ?? null);
      const placeholders = HP_COLUMNS.map((_, i) => `$${i + 1}`).join(", ");
      await client.query(
        `insert into hp_payment_lines (${HP_COLUMNS.join(", ")}) values (${placeholders})`,
        values,
      );
      inserted++;
    }
    console.log(`Inserted ${inserted} hp_payment_lines rows`);

    await client.query("COMMIT");
    console.log("Committed.");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Rolled back due to error:", err);
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
