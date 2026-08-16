import type { Metadata } from "next";
import PagePlaceholder from "../components/PagePlaceholder";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Traveloop collects, uses and protects your personal data.",
  alternates: { canonical: "/privacy" },
  // Placeholder content — keep it out of the index until the real policy lands.
  robots: { index: false, follow: true },
};

export default function PrivacyPage() {
  return (
    <PagePlaceholder
      eyebrow="Privacy Policy"
      title="Our privacy policy is coming soon."
      body="We're finalizing the details of how we collect, use and protect your data. Check back soon."
    />
  );
}
