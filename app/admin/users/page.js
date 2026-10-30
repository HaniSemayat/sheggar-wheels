import AdminUsersClient from "./AdminUsersClient";

export const metadata = {
  title: "Admin Users Management | Sheggar Wheels",
  description: "View registered users, roles, and manage suspensions.",
};

export default function AdminUsersPage() {
  return <AdminUsersClient />;
}
