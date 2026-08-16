import { logout } from "../actions";
import AdminNav from "./AdminNav";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div className="admin-header-left">
          <p className="admin-header-title">Traveloop admin</p>
          <AdminNav />
        </div>
        <form action={logout}>
          <button className="button ghost dark admin-logout" type="submit">
            Sign out
          </button>
        </form>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
