import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Malaysia Travel Guides & Culture Stories",
  description:
    "Practical guides to travelling in Malaysia — Malay phrases worth knowing, food worth queueing for, and the culture behind the experiences we run.",
  alternates: { canonical: "/blogs" },
  openGraph: {
    title: "Malaysia Travel Guides & Culture Stories",
    description:
      "Practical guides to travelling in Malaysia — language, food, and culture, from the Traveloop team.",
    url: "/blogs",
  },
};

export default function BlogsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
