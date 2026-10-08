import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import jwt from "jsonwebtoken";
import WalletClient from "./WalletClient";

export const dynamic = "force-dynamic";

export default async function WalletPage() {
  const token = (await cookies()).get("videa_token")?.value;
  if (!token || !process.env.JWT_SECRET) redirect("/login");
  try {
    const session = jwt.verify(token, process.env.JWT_SECRET);
    if (!session?.sub) redirect("/login");
  } catch { redirect("/login"); }
  return <WalletClient />;
}
