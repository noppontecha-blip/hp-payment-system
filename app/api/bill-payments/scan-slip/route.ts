import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Basic sanity-check read of an uploaded transfer slip — extracts the amount/date/bank/
// reference and a rough "does this look like a real transfer slip" flag. This is explicitly
// NOT fraud detection (per the owner's confirmed scope), just auto-fill + a heads-up.
type ScanResult = {
  amount: number | null;
  date: string | null;
  bank: string | null;
  reference: string | null;
  looks_like_transfer_slip: boolean;
};

function extToMediaType(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "png") return "image/png";
  if (ext === "webp") return "image/webp";
  if (ext === "gif") return "image/gif";
  return "image/jpeg";
}

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { message: "ยังไม่ได้ตั้งค่า ANTHROPIC_API_KEY บนเซิร์ฟเวอร์ — อัปโหลดสลิปได้ แต่ยังอ่านข้อมูลอัตโนมัติไม่ได้" },
      { status: 400 },
    );
  }

  const { path } = (await request.json()) as { path?: string };
  if (!path) {
    return NextResponse.json({ message: "ไม่พบไฟล์สลิป" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: fileBlob, error: downloadError } = await supabase.storage
    .from("payment-slips")
    .download(path);
  if (downloadError || !fileBlob) {
    return NextResponse.json({ message: "ดาวน์โหลดไฟล์สลิปไม่สำเร็จ" }, { status: 500 });
  }

  const buffer = Buffer.from(await fileBlob.arrayBuffer());
  const base64 = buffer.toString("base64");

  try {
    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: extToMediaType(path) as never, data: base64 },
            },
            {
              type: "text",
              text: `นี่คือรูปภาพสลิปโอนเงินธนาคาร ให้อ่านและตอบกลับเป็น JSON เท่านั้น (ไม่มีข้อความอื่น) ในรูปแบบนี้:
{"amount": number หรือ null, "date": "YYYY-MM-DD" หรือ null, "bank": string หรือ null, "reference": string หรือ null, "looks_like_transfer_slip": boolean}

looks_like_transfer_slip ให้เป็น true เฉพาะเมื่อภาพนี้ดูเหมือนสลิปโอนเงิน/ยืนยันการชำระเงินจริง (มีโลโก้ธนาคาร, จำนวนเงิน, วันที่/เวลา, เลขอ้างอิง) — นี่เป็นเพียงการตรวจสอบเบื้องต้น ไม่ใช่การตรวจสอบการปลอมแปลงระดับธนาคาร`,
            },
          ],
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const result = JSON.parse(jsonMatch ? jsonMatch[0] : raw) as ScanResult;

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { message: err instanceof Error ? err.message : "อ่านข้อมูลสลิปไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
