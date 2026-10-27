import AdminListingsClient from "./AdminListingsClient";

export const metadata = {
  title: "Admin Listing Moderation | Sheggar Wheels",
  description: "Review, approve, and reject car listings on the platform.",
};

export default function AdminListingsPage() {
  return <AdminListingsClient />;
}
