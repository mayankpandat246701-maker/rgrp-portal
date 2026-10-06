import { NextResponse } from "next/server";
import { generateCaptcha } from "@/lib/captcha";

export async function GET() {
  try {
    const captcha = generateCaptcha();
    return NextResponse.json(captcha, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json(
      { error: "कैप्चा अभी उपलब्ध नहीं है। कृपया बाद में प्रयास करें।" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
