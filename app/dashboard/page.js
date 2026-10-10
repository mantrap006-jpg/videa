import { redirect } from "next/navigation";

// The dashboard has been retired. Keep old links working by sending users to Points.
export default function DashboardPage() {
  redirect("/points");
}
