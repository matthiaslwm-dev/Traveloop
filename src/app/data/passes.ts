export type PassKey = "silver" | "gold" | "platinum";

/** ISO currency code every pass is sold in. Stripe expects it lower-cased. */
export const PASS_CURRENCY = "myr";

export type PassTier = {
  key: PassKey;
  name: string;
  /**
   * Authoritative charge amount in the smallest currency unit (sen).
   * This — never a value posted by the browser — is what Stripe is charged.
   */
  priceCents: number;
  originalPriceCents: number;
  badge?: string;
  tagline: string;
  sub: string;
  /** Short bullet summary shown on pricing cards */
  highlights: string[];
  /** Display strings derived from the amounts above, so the two can't drift apart. */
  price: string;
  originalPrice: string;
};

type PassTierSeed = Omit<PassTier, "price" | "originalPrice">;

/** 3990 -> "39.90" */
function formatMinorUnits(amount: number): string {
  return (amount / 100).toFixed(2);
}

const passTierSeeds: PassTierSeed[] = [
  {
    key: "silver",
    name: "Silver",
    priceCents: 3990,
    originalPriceCents: 7990,
    tagline: "Great value.",
    sub: "More to explore.",
    highlights: [
      "Retail deals worth up to MYR 15,000",
      "Food & beverage deals worth up to MYR 3,000",
      "25% off Lion Dance, Batik & Indian Culture experiences",
    ],
  },
  {
    key: "gold",
    name: "Gold",
    priceCents: 6990,
    originalPriceCents: 13990,
    badge: "Most Popular",
    tagline: "Most popular.",
    sub: "More to enjoy.",
    highlights: [
      "Everything in Silver",
      "Travel & personal accident insurance (Tokio Marine)",
      "Up to MYR 50,000 accidental death & disablement cover",
    ],
  },
  {
    key: "platinum",
    name: "Platinum",
    priceCents: 8990,
    originalPriceCents: 17990,
    tagline: "Ultimate experience.",
    sub: "More to indulge.",
    highlights: [
      "Everything in Gold",
      "75% off Lion Dance Experience — the deepest discount",
      "90-minute private photography session",
      "Priority support",
    ],
  },
];

export const passTiers: PassTier[] = passTierSeeds.map((tier) => ({
  ...tier,
  price: formatMinorUnits(tier.priceCents),
  originalPrice: formatMinorUnits(tier.originalPriceCents),
}));

/** Narrows an untrusted value (request body, query string) to a real tier key. */
export function isPassKey(value: unknown): value is PassKey {
  return passTiers.some((tier) => tier.key === value);
}

/** Looks up a tier by key, or returns undefined for anything unrecognised. */
export function getPassTier(key: unknown): PassTier | undefined {
  return isPassKey(key) ? passTiers.find((tier) => tier.key === key) : undefined;
}

export type PassComparisonValue = string | boolean;

export type PassComparisonRow = {
  label: string;
  values: Record<PassKey, PassComparisonValue>;
};

export const passComparison: PassComparisonRow[] = [
  {
    label: "Retail deals",
    values: { silver: "Up to MYR 15,000", gold: "Up to MYR 15,000", platinum: "Up to MYR 15,000" },
  },
  {
    label: "Food & beverage deals",
    values: { silver: "Up to MYR 3,000", gold: "Up to MYR 3,000", platinum: "Up to MYR 3,000" },
  },
  {
    label: "Lion Dance Experience",
    values: { silver: "25% off", gold: "25% off", platinum: "75% off" },
  },
  {
    label: "Batik Painting Experience",
    values: { silver: "25% off", gold: "25% off", platinum: "25% off" },
  },
  {
    label: "Indian Culture Experience",
    values: { silver: "25% off", gold: "25% off", platinum: "25% off" },
  },
  {
    label: "Travel & accident insurance",
    values: { silver: false, gold: true, platinum: true },
  },
  {
    label: "Private photography session",
    values: { silver: false, gold: false, platinum: true },
  },
  {
    label: "Priority support",
    values: { silver: false, gold: false, platinum: true },
  },
];

export type PassPerkCategory = {
  icon: string;
  img: string;
  title: string;
  description: string;
  /** Per-tier detail text; a tier is omitted if the perk isn't part of that tier */
  tierNotes: Partial<Record<PassKey, string>>;
};

export const passPerkCategories: PassPerkCategory[] = [
  {
    icon: "bag",
    img: "/privileges.png",
    title: "Retail deals",
    description:
      "Save at partner shops and attractions across Malaysia, including Upside Down Museum Penang, BMS Organics, and Glass Museum Penang.",
    tierNotes: {
      silver: "Worth up to MYR 15,000",
      gold: "Worth up to MYR 15,000",
      platinum: "Worth up to MYR 15,000",
    },
  },
  {
    icon: "fork",
    img: "/charkueyteow.jpg",
    title: "Food & beverage deals",
    description:
      "Exclusive discounts at Starbucks, Le Petit Four Pâtisserie, Mixue, Family Mart, Hero Tea, Rendez by Meowcho, and more.",
    tierNotes: {
      silver: "Worth up to MYR 3,000",
      gold: "Worth up to MYR 3,000",
      platinum: "Worth up to MYR 3,000",
    },
  },
  {
    icon: "ticket",
    img: "/lion-dance.webp",
    title: "Lion Dance Experience",
    description:
      "Learn the basics of lion dance with authentic instruments and a traditional lion head. Sessions run Tuesday & Thursday 8:00–10:00 PM and Sunday 1:00–3:00 PM. Children aged 5 and under join free.",
    tierNotes: {
      silver: "25% off · Groups of 2–4: MYR 1,200 · Additional participant: MYR 100/pax",
      gold: "25% off · Groups of 2–4: MYR 1,200 · Additional participant: MYR 100/pax",
      platinum: "75% off · Groups of 2–4: MYR 400 · Additional participant: MYR 100/pax",
    },
  },
  {
    icon: "landmark",
    img: "/batik.jpg",
    title: "Batik Painting Experience",
    description:
      "Discover the history behind Malaysian batik and create your own hand-painted souvenir, including museum admission and light refreshments. Runs Wednesday 10:00 AM–12:00 PM. Children aged 4 and under join free.",
    tierNotes: {
      silver: "25% off · MYR 390/pax (reg. MYR 520)",
      gold: "25% off · MYR 390/pax (reg. MYR 520)",
      platinum: "25% off · MYR 390/pax (reg. MYR 520)",
    },
  },
  {
    icon: "users",
    img: "/kolam.png",
    title: "Indian Culture Experience",
    description:
      "Try your hand at kolam (rice-flour rangoli) art, a traditional Indian cooking lesson, and a Bharatanatyam dance demonstration. Runs Sunday 3:00–5:00 PM. Children aged 5 and under join free.",
    tierNotes: {
      silver: "25% off · MYR 390/pax (reg. MYR 520)",
      gold: "25% off · MYR 390/pax (reg. MYR 520)",
      platinum: "25% off · MYR 390/pax (reg. MYR 520)",
    },
  },
  {
    icon: "shield",
    img: "/tokio.png",
    title: "Travel & accident insurance",
    description:
      "Group Personal Accident Insurance underwritten by Tokio Marine Insurans (Malaysia) Berhad, covering registered participants aged 30 days to 75 years while in Malaysia — including amateur sports, scuba diving up to 50m, and mountaineering.",
    tierNotes: {
      gold: "Up to MYR 50,000 accidental death & disablement · MYR 500 medical expenses",
      platinum: "Up to MYR 50,000 accidental death & disablement · MYR 500 medical expenses",
    },
  },
  {
    icon: "camera",
    img: "https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&w=1000&q=85",
    title: "Private photography session",
    description:
      "A 90-minute private photoshoot with a professional photographer around Penang's Heritage Zone or Batu Ferringhi hotels, plus 5 complimentary high-resolution photos and a highlight reel. Runs Saturday 8:30–10:00 AM and 10:00–11:30 AM.",
    tierNotes: {
      platinum: "From MYR 150 for 10 digital photos · Book at least 3 days ahead",
    },
  },
];
