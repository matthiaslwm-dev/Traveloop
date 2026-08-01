export type PartnerCategory = "Dining" | "Shopping" | "Experiences" | "Wellness";

export type Partner = {
  name: string;
  logo?: "starbucks";
  icon?: string;
  category: PartnerCategory;
  location?: string;
  deal: string;
};

export const partnerCategories: PartnerCategory[] = [
  "Dining",
  "Shopping",
  "Experiences",
  "Wellness",
];

export const partners: Partner[] = [
  {
    name: "Starbucks",
    logo: "starbucks",
    category: "Dining",
    deal: "15% off all beverages",
  },
  {
    name: "Mixue",
    icon: "cup",
    category: "Dining",
    deal: "Buy 1 free 1 on ice cream",
  },
  {
    name: "Le Petit Four Pâtisserie",
    icon: "cake",
    category: "Dining",
    location: "Penang",
    deal: "10% off pastries & cakes",
  },
  {
    name: "Family Mart",
    icon: "store",
    category: "Shopping",
    deal: "5% off storewide",
  },
  {
    name: "Hero Tea",
    icon: "cup",
    category: "Dining",
    location: "Kuala Lumpur",
    deal: "20% off signature teas",
  },
  {
    name: "Rendez by Meowcho",
    icon: "cup",
    category: "Dining",
    location: "Kuala Lumpur",
    deal: "Free upsize on any drink",
  },
  {
    name: "Upside Down Museum Penang",
    icon: "landmark",
    category: "Experiences",
    location: "Penang",
    deal: "25% off admission",
  },
  {
    name: "BMS Organics",
    icon: "leaf",
    category: "Dining",
    deal: "10% off organic meals",
  },
  {
    name: "Glass Museum Penang",
    icon: "landmark",
    category: "Experiences",
    location: "Penang",
    deal: "20% off admission",
  },
  {
    name: "Tokio Marine",
    icon: "shield",
    category: "Wellness",
    deal: "Complimentary travel insurance",
  },
];
