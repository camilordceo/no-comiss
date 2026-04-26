import { z } from "zod";

/* ---------------- Auth ---------------- */

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ingresa un email válido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});
export type LoginInput = z.infer<typeof loginSchema>;

const strongPassword = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[a-z]/, "Agrega una letra minúscula")
  .regex(/[A-Z]/, "Agrega una letra mayúscula")
  .regex(/\d/, "Agrega un número");

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2, "Cuéntanos tu nombre completo"),
    email: z.string().trim().toLowerCase().email("Ingresa un email válido"),
    password: strongPassword,
    confirmPassword: z.string().min(8, "Confirma tu contraseña"),
    terms: z.literal(true, {
      errorMap: () => ({ message: "Debes aceptar los términos para continuar" }),
    }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });
export type SignupInput = z.infer<typeof signupSchema>;

/* ---------------- Listings (Colombia) ---------------- */

export const CIUDADES = [
  { value: "Bogotá", label: "Bogotá" },
  { value: "Medellín", label: "Medellín" },
  { value: "Cali", label: "Cali" },
] as const;

export const TIPOS_NEGOCIO = [
  { value: "venta", label: "Venta" },
  { value: "arriendo", label: "Arriendo" },
] as const;

export const TIPOS_INMUEBLE = [
  { value: "apartamento", label: "Apartamento" },
  { value: "casa", label: "Casa" },
  { value: "apartaestudio", label: "Apartaestudio" },
  { value: "local", label: "Local comercial" },
  { value: "oficina", label: "Oficina" },
  { value: "bodega", label: "Bodega" },
] as const;

export const listingSchema = z.object({
  tipo_negocio: z.enum(["venta", "arriendo"], {
    errorMap: () => ({ message: "Selecciona venta o arriendo" }),
  }),
  tipo_inmueble: z.string().trim().min(1, "Selecciona el tipo de inmueble"),
  ciudad: z.string().trim().min(2, "Selecciona la ciudad"),
  ubicacion: z.string().trim().min(3, "Indica el barrio o sector"),
  habitaciones: z.coerce.number().int().min(0).max(20),
  banos: z.coerce.number().int().min(0).max(20),
  parqueaderos: z.coerce.number().int().min(0).max(20),
  area_m2: z.coerce.number().int().min(10).max(10000),
  precio: z.coerce.number().min(100000).max(50000000000),
  descripcion: z
    .string()
    .trim()
    .min(20, "Mínimo 20 caracteres — cuenta lo bueno")
    .max(2000, "Máximo 2000 caracteres"),
});
export type ListingInput = z.infer<typeof listingSchema>;

/* ---------------- Settings ---------------- */

export const profileSchema = z.object({
  nombre: z.string().trim().min(2, "Nombre requerido"),
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
