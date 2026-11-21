import { NextResponse } from "next/server";

export async function GET(request) {
  const headers = request.headers;
  const countryCode = (headers.get("x-vercel-ip-country") || headers.get("cf-ipcountry") || "").toUpperCase();
  const city = headers.get("x-vercel-ip-city") || "";
  const region = headers.get("x-vercel-ip-country-region") || "";
  const country = headers.get("x-vercel-ip-country-name") || (countryCode ? new Intl.DisplayNames(["en"], { type: "region" }).of(countryCode) : "");
  // Location is inferred from hosting-provided request headers; no browser GPS permission is required.
  return NextResponse.json({ countryCode, city, region, country }, { headers: { "Cache-Control": "no-store" } });
}
