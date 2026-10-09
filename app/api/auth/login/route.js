import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    error: "Email and password login is disabled. Please continue with Google at /auth?mode=login."
  }, { status: 410 });
}
