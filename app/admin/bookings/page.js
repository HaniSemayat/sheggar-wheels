import AdminBookingsClient from "./AdminBookingsClient";

export const metadata = {
  title: "Admin Bookings & Transactions | Sheggar Wheels",
  description: "View all marketplace bookings, financial snapshots, and export CSV.",
};

export default function AdminBookingsPage() {
  return <AdminBookingsClient />;
}
