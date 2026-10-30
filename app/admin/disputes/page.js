import AdminDisputesClient from "./AdminDisputesClient";

export const metadata = {
  title: "Admin Dispute Resolution | Sheggar Wheels",
  description: "Manage customer claims and publish official mediation resolutions.",
};

export default function AdminDisputesPage() {
  return <AdminDisputesClient />;
}
