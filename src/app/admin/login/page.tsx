import type { Metadata } from "next";
import { login } from "./actions";

export const metadata: Metadata = {
  title: "Admin login — Traveloop",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AdminLoginPage({ searchParams }: LoginPageProps) {
  const hasError = (await searchParams).error === "1";

  return (
    <main className="admin-login">
      <form className="admin-login-card" action={login}>
        <p className="eyebrow">Traveloop</p>
        <h1>Admin sign in</h1>

        {hasError && <p className="admin-login-error">Incorrect ID or password.</p>}

        <label className="admin-field">
          <span>ID</span>
          <input name="id" type="text" autoComplete="username" required autoFocus />
        </label>

        <label className="admin-field">
          <span>Password</span>
          <input name="password" type="password" autoComplete="current-password" required />
        </label>

        <button className="button primary" type="submit">
          Sign in
        </button>
      </form>
    </main>
  );
}
