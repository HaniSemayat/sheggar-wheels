import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Renter Dashboard | Sheggar Wheels",
  description: "View and manage your active car rentals, trip history, and spend.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
