import {
  formatAmount,
  formatDiscountPercent,
  getEntitlement,
  getExperience,
  regularPerPersonCents,
  tierPerPersonCents,
  type Experience,
  type ExperienceKey,
} from "./experiences";

export type PassKey = "silver" | "gold" | "platinum";

/** Every tier, cheapest first — the order tiers are listed in throughout the site. */
export const tierKeys: PassKey[] = ["silver", "gold", "platinum"];

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

/** Highlights may be null when a generated bullet doesn't apply; nulls are dropped. */
type PassTierSeed = Omit<PassTier, "price" | "originalPrice" | "highlights"> & {
  highlights: (string | null)[];
};

/** 3990 -> "39.90" */
function formatMinorUnits(amount: number): string {
  return (amount / 100).toFixed(2);
}

/** 39000 -> "MYR 390", keeping the sen only when a price isn't whole ringgit. */
function perPersonLabel(cents: number): string {
  return `MYR ${cents % 100 === 0 ? String(cents / 100) : formatAmount(cents)}`;
}

/** The experiences a pass is sold on, in the order they're listed. */
const comparedExperienceKeys: ExperienceKey[] = ["lion-dance", "batik", "indian-culture"];

const comparedExperiences: Experience[] = comparedExperienceKeys.flatMap((key) => {
  const experience = getExperience(key);
  return experience ? [experience] : [];
});

/** "Lion Dance Experience" -> "Lion Dance" */
function shortExperienceName(experience: Experience): string {
  return experience.name.replace(/ Experience$/, "");
}

/** ["A", "B", "C"] -> "A, B & C" */
function joinNames(names: string[]): string {
  return names.length > 1 ? `${names.slice(0, -1).join(", ")} & ${names.at(-1)}` : names[0];
}

/**
 * The experience-discount bullet on a pricing card, e.g.
 * "50% off Lion Dance, Batik Painting & Indian Culture experiences".
 *
 * The rate most experiences share becomes the headline and anything discounted
 * differently is named with its own price — Platinum's Lion Dance lands at
 * MYR 130, deeper than its flat 75%, and folding that into one percentage
 * would put a wrong number on the card.
 */
function experienceHighlight(tier: PassKey): string | null {
  const entries = comparedExperiences
    .map((experience) => ({ experience, entitlement: getEntitlement(tier, experience) }))
    .filter(({ entitlement }) => entitlement.entitled);

  if (entries.length === 0) return null;

  const counts = new Map<number, number>();
  for (const { entitlement } of entries) {
    counts.set(entitlement.discountPercent, (counts.get(entitlement.discountPercent) ?? 0) + 1);
  }
  const [headline] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

  const shared = entries.filter(({ entitlement }) => entitlement.discountPercent === headline);
  const outliers = entries.filter(({ entitlement }) => entitlement.discountPercent !== headline);

  const names = joinNames(shared.map(({ experience }) => shortExperienceName(experience)));
  const parts = [`${formatDiscountPercent(headline)}% off ${names} experiences`];

  for (const { experience } of outliers) {
    const cents = tierPerPersonCents(experience, tier);
    if (cents === null) continue;
    parts.push(`${shortExperienceName(experience)} from ${perPersonLabel(cents)}/pax`);
  }

  return parts.join(" · ");
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
      experienceHighlight("silver"),
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
      experienceHighlight("gold"),
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
      experienceHighlight("platinum"),
      "90-minute private photography session",
      "Priority support",
    ],
  },
];

export const passTiers: PassTier[] = passTierSeeds.map((tier) => ({
  ...tier,
  highlights: tier.highlights.filter((h): h is string => h !== null),
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

/** A priced cell: the regular rate struck through, what this tier pays, and the saving. */
export type PassComparisonPrice = {
  regular: string;
  price: string;
  discount: string;
};

export type PassComparisonValue = string | boolean | PassComparisonPrice;

export function isComparisonPrice(value: PassComparisonValue): value is PassComparisonPrice {
  return typeof value === "object";
}

export type PassComparisonRow = {
  label: string;
  values: Record<PassKey, PassComparisonValue>;
};

/**
 * One comparison row per bookable experience, priced straight from
 * `experiences.ts` rather than transcribed — the table showed stale discounts
 * for months because those two were maintained by hand.
 */
function experienceRow(experience: Experience): PassComparisonRow {
  const regular = regularPerPersonCents(experience);

  const values = tierKeys.reduce((acc, tier) => {
    const entitlement = getEntitlement(tier, experience);
    const cents = tierPerPersonCents(experience, tier);

    acc[tier] =
      !entitlement.entitled || cents === null || regular === null
        ? entitlement.entitled
        : {
            regular: `${perPersonLabel(regular)}/pax`,
            price: `${perPersonLabel(cents)}/pax`,
            discount: `${formatDiscountPercent(entitlement.discountPercent)}% off`,
          };
    return acc;
  }, {} as Record<PassKey, PassComparisonValue>);

  return { label: experience.name, values };
}

const experienceRows: PassComparisonRow[] = comparedExperiences.map(experienceRow);

export const passComparison: PassComparisonRow[] = [
  {
    label: "Retail deals",
    values: { silver: "Up to MYR 15,000", gold: "Up to MYR 15,000", platinum: "Up to MYR 15,000" },
  },
  {
    label: "Food & beverage deals",
    values: { silver: "Up to MYR 3,000", gold: "Up to MYR 3,000", platinum: "Up to MYR 3,000" },
  },
  ...experienceRows,
  {
    label: "Travel & accident insurance",
    values: { silver: false, gold: true, platinum: true },
  },
  {
    label: "Private photography session",
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

/**
 * A perk backed by a bookable experience states no prices of its own — they're
 * generated from `experiences.ts` so a rate change lands here automatically.
 */
type PassPerkCategorySeed = Omit<PassPerkCategory, "tierNotes"> &
  ({ tierNotes: Partial<Record<PassKey, string>> } | { experienceKey: ExperienceKey });

/** "25% off · MYR 390/pax (reg. MYR 520)" */
function experienceTierNotes(experience: Experience): Partial<Record<PassKey, string>> {
  const regular = regularPerPersonCents(experience);
  const notes: Partial<Record<PassKey, string>> = {};

  for (const tier of tierKeys) {
    const entitlement = getEntitlement(tier, experience);
    if (!entitlement.entitled) continue;

    const cents = tierPerPersonCents(experience, tier);
    const percent = `${formatDiscountPercent(entitlement.discountPercent)}% off`;

    notes[tier] =
      cents === null || regular === null
        ? percent
        : `${percent} · ${perPersonLabel(cents)}/pax (reg. ${perPersonLabel(regular)})`;
  }

  return notes;
}

const passPerkCategorySeeds: PassPerkCategorySeed[] = [
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
    experienceKey: "lion-dance",
  },
  {
    icon: "landmark",
    img: "/batik.jpg",
    title: "Batik Painting Experience",
    description:
      "Discover the history behind Malaysian batik and create your own hand-painted souvenir, including museum admission and light refreshments. Runs Wednesday 10:00 AM–12:00 PM. Children aged 4 and under join free.",
    experienceKey: "batik",
  },
  {
    icon: "users",
    img: "/kolam.png",
    title: "Indian Culture Experience",
    description:
      "Try your hand at kolam (rice-flour rangoli) art, a traditional Indian cooking lesson, and a Bharatanatyam dance demonstration. Runs Sunday 3:00–5:00 PM. Children aged 5 and under join free.",
    experienceKey: "indian-culture",
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

export const passPerkCategories: PassPerkCategory[] = passPerkCategorySeeds.flatMap((seed) => {
  if ("tierNotes" in seed) return [seed];

  const { experienceKey, ...rest } = seed;
  const experience = getExperience(experienceKey);
  return experience ? [{ ...rest, tierNotes: experienceTierNotes(experience) }] : [];
});
