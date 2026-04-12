export interface PhotoItem {
  id: string;
  url: string;
  path: string;
  room: string;
  isHero: boolean;
  uploading: boolean;
  error: string | null;
}

export interface RentCastResult {
  formattedAddress: string;
  city: string;
  state: string;
  zipCode: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  squareFootage?: number | null;
  lotSize?: number | null;
  yearBuilt?: number | null;
  stories?: number | null;
  garage?: number | null;
  estimatedValue?: number | null;
  priceRangeLow?: number | null;
  priceRangeHigh?: number | null;
  comparables?: RentCastComp[];
}

export interface RentCastComp {
  formattedAddress: string;
  price: number;
  squareFootage?: number;
  bedrooms?: number;
  bathrooms?: number;
  correlation: number;
  distance: number;
  listedDate?: string;
  daysOnMarket?: number;
}

export type PropertyType = "single_family" | "condo" | "townhouse" | "multi_family";

export interface WizardData {
  // Step 1 — Address
  address: string;
  rentcastData: RentCastResult | null;
  // Step 2 — Details
  propertyType: PropertyType;
  bedrooms: number;
  bathrooms: number;
  sqft: number;
  lotSqft: number;
  yearBuilt: number;
  stories: number;
  garageSpaces: number;
  hoaMonthly: number;
  // Step 3 — Photos
  photos: PhotoItem[];
  // Step 4 — Video
  videoUrl: string;
  // Step 5 — Story
  story: string;
  // Step 6 — Pricing
  askingPrice: number;
}

export const INITIAL_WIZARD_DATA: WizardData = {
  address: "",
  rentcastData: null,
  propertyType: "single_family",
  bedrooms: 3,
  bathrooms: 2,
  sqft: 0,
  lotSqft: 0,
  yearBuilt: 0,
  stories: 1,
  garageSpaces: 0,
  hoaMonthly: 0,
  photos: [],
  videoUrl: "",
  story: "",
  askingPrice: 0,
};

export const ROOM_OPTIONS = [
  "Living Room",
  "Kitchen",
  "Primary Bedroom",
  "Bedroom",
  "Primary Bathroom",
  "Bathroom",
  "Dining Room",
  "Office / Study",
  "Garage",
  "Backyard",
  "Front Exterior",
  "Other",
];

export const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: "single_family", label: "Single Family" },
  { value: "condo",         label: "Condo" },
  { value: "townhouse",     label: "Townhouse" },
  { value: "multi_family",  label: "Multi-Family" },
];
