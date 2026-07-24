import { NextResponse } from "next/server";

// Placeholder for the "ดึงข้อมูลจาก DBD" button on the vendor form.
//
// The juristic-registry lookup (opendata.dbd.go.th dataset_11_03) turned out NOT to be a free
// CKAN datastore resource despite appearing in the open-data catalog — datastore_search against
// its resource_id returns "Resource not found". The catalog entry only documents the real service
// at openapi.dbd.go.th/api/v1/juristic_person/{id}, which requires a DBD-issued API key/subscription
// (contact datawarehouse@dbd.go.th) and doesn't respond without one.
//
// Wire this up once an API key is obtained: swap the stub below for a fetch to
// openapi.dbd.go.th with the key, mapping its response onto { name, registered_address }.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const taxId = searchParams.get("taxId");

  if (!taxId) {
    return NextResponse.json({ found: false, message: "กรุณาระบุเลขทะเบียนนิติบุคคล" }, { status: 400 });
  }

  return NextResponse.json(
    {
      found: false,
      message:
        "การเชื่อมต่อ DBD ยังใช้งานไม่ได้ — ต้องขอ API key จาก DBD ก่อน (datawarehouse@dbd.go.th) กรุณากรอกข้อมูลด้วยตนเอง",
    },
    { status: 200 },
  );
}
