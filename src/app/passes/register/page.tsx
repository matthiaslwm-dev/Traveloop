import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { getPassTier, passTiers } from "@/app/data/passes";
import RegistrationForm from "./RegistrationForm";

export const metadata: Metadata = {
  title: "Complete your registration",
  robots: { index: false, follow: false },
  alternates: { canonical: "/passes/register" },
};

type RegisterPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const pass = (await searchParams).pass;
  // An unrecognised or missing ?pass just means an empty cart to start from —
  // the cart step itself lets the buyer add any tier, one or many.
  const seedTier = getPassTier(typeof pass === "string" ? pass : undefined);

  return (
    <>
      <Navbar forceScrolled />
      <main className="register-page">
        <div className="register-layout">
          <aside className="register-summary">
            <p className="eyebrow">Your order</p>
            <h1>Build your order</h1>
            <p className="register-summary-lede">
              Add a pass for each traveller — everyone in your group needs their own tourist
              registration and insurance details.
            </p>
            <Link className="register-summary-back" href="/passes">
              ← Choose a different pass
            </Link>
          </aside>

          <RegistrationForm passTiers={passTiers} seedPassKey={seedTier?.key} />
        </div>
      </main>
      <Footer />
    </>
  );
}
