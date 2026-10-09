import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    error: "Email and password registration is disabled. Please create your account with Google at /auth?mode=signup."
  }, { status: 410 });
}
