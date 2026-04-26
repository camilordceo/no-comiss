import { z } from "zod";

/* ─────────── Auth ─────────── */

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

const strongPassword = z
  .string()
  .min(8, "At least 8 characters")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/\d/, "Add a number");

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Tell us your full name"),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: strongPassword,
    confirmPassword: z.string().min(8, "Confirm your password"),
    terms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms to continue" }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });
export type SignupInput = z.infer<typeof signupSchema>;

/* ─────────── Listings (US) ─────────── */

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
] as const;
export type USStateCode = (typeof US_STATES)[number];

export const PROPERTY_TYPES = [
  { value: "single_family", label: "Single Family" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi_family", label: "Multi-Family" },
] as const;

export const ROOM_TAGS = [
  { value: "exterior_front", label: "Front Exterior" },
  { value: "exterior_back", label: "Backyard" },
  { value: "kitchen", label: "Kitchen" },
  { value: "living_room", label: "Living Room" },
  { value: "dining_room", label: "Dining Room" },
  { value: "primary_bedroom", label: "Primary Bedroom" },
  { value: "bedroom", label: "Bedroom" },
  { value: "bathroom", label: "Bathroom" },
  { value: "office", label: "Office" },
  { value: "garage", label: "Garage" },
  { value: "basement", label: "Basement" },
  { value: "other", label: "Other" },
] as const;

const currentYear = new Date().getFullYear();

export const listingSchema = z.object({
  tipo_inmueble: z.enum(["single_family", "condo", "townhouse", "multi_family"], {
    errorMap: () => ({ message: "Pick a property type" }),
  }),
  address_line1: z.string().trim().min(3, "Enter a street address"),
  address_line2: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
  city: z.string().trim().min(2, "City required"),
  state: z.enum(US_STATES, { errorMap: () => ({ message: "Pick a state" }) }),
  zip_code: z
    .string()
    .trim()
    .regex(/^\d{5}(-\d{4})?$/, "Use 12345 or 12345-6789"),
  bedrooms: z.coerce.number().int().min(0).max(20),
  bathrooms: z.coerce.number().min(0).max(20),
  garage_spaces: z.coerce.number().int().min(0).max(20),
  sqft: z.coerce.number().int().min(100, "Min 100 sqft").max(50000),
  year_built: z.coerce
    .number()
    .int()
    .min(1800)
    .max(currentYear)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  hoa_monthly: z.coerce
    .number()
    .min(0)
    .max(10000)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  price: z.coerce
    .number()
    .min(10000, "Min $10,000")
    .max(100000000, "Above maximum"),
  description: z
    .string()
    .trim()
    .min(20, "Min 20 characters — give buyers something to feel")
    .max(2000, "Max 2000 characters"),
});
export type ListingInput = z.infer<typeof listingSchema>;

/* ─────────── Settings ─────────── */

export const profileSchema = z.object({
  nombre: z.string().trim().min(2, "Name required"),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
});
export type ProfileInput = z.infer<typeof profileSchema>;

/* ─────────── Media ─────────── */

export const mediaUpdateSchema = z.object({
  room_tag: z.string().nullable().optional(),
  caption: z.string().trim().max(500).nullable().optional(),
  is_hero: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});
export type MediaUpdateInput = z.infer<typeof mediaUpdateSchema>;
