import { z } from "zod";

/* ---------------- Auth ---------------- */

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "At least 8 characters"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Tell us your full name"),
    email: z.string().trim().toLowerCase().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm your password"),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });
export type SignupInput = z.infer<typeof signupSchema>;

/* ---------------- Onboarding ---------------- */

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
  "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
  "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC",
] as const;

export const PROPERTY_TYPES = [
  { value: "single_family", label: "Single Family" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "multi_family", label: "Multi-Family" },
] as const;

export const ROOM_TAGS = [
  { value: "exterior", label: "Exterior" },
  { value: "kitchen", label: "Kitchen" },
  { value: "living_room", label: "Living Room" },
  { value: "dining_room", label: "Dining Room" },
  { value: "bedroom", label: "Bedroom" },
  { value: "bathroom", label: "Bathroom" },
  { value: "office", label: "Office" },
  { value: "garage", label: "Garage" },
  { value: "backyard", label: "Backyard" },
  { value: "basement", label: "Basement" },
  { value: "other", label: "Other" },
] as const;

export const addressSchema = z.object({
  address_line1: z.string().trim().min(3, "Enter a street address"),
  address_line2: z.string().trim().optional().or(z.literal("")),
  ciudad: z.string().trim().min(2, "City required"),
  state: z.enum(US_STATES, { errorMap: () => ({ message: "Pick a state" }) }),
  zip_code: z.string().trim().regex(/^\d{5}(-\d{4})?$/, "Use 12345 or 12345-6789"),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const detailsSchema = z.object({
  tipo_inmueble: z.enum(["single_family", "condo", "townhouse", "multi_family"]),
  habitaciones: z.coerce.number().int().min(0).max(50),
  banos: z.coerce.number().min(0).max(50),
  sqft: z.coerce.number().int().min(100).max(100000),
  lot_sqft: z.coerce.number().int().min(0).max(10000000).optional().nullable(),
  year_built: z.coerce.number().int().min(1700).max(new Date().getFullYear() + 1).optional().nullable(),
  stories: z.coerce.number().int().min(1).max(10).optional().nullable(),
  garage_spaces: z.coerce.number().int().min(0).max(20).optional().nullable(),
  hoa_monthly: z.coerce.number().min(0).max(100000).optional().nullable(),
  precio: z.coerce.number().min(1000).max(1000000000),
});
export type DetailsInput = z.infer<typeof detailsSchema>;

export const storySchema = z.object({
  seller_story: z.string().trim().max(2000, "Keep it under 2000 characters").optional().or(z.literal("")),
  description_short: z.string().trim().max(280, "Keep it under 280 characters").optional().or(z.literal("")),
});
export type StoryInput = z.infer<typeof storySchema>;

/* ---------------- Settings ---------------- */

export const profileSchema = z.object({
  nombre: z.string().trim().min(2, "Name required"),
  bio: z.string().trim().max(500).optional().or(z.literal("")),
});
export type ProfileInput = z.infer<typeof profileSchema>;

/* ---------------- Media ---------------- */

export const mediaUpdateSchema = z.object({
  room_tag: z.string().nullable().optional(),
  caption: z.string().trim().max(500).nullable().optional(),
  is_hero: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});
export type MediaUpdateInput = z.infer<typeof mediaUpdateSchema>;
