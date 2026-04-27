/**
 * Hand-authored Database types matching the Rentmies multi-tenant Supabase schema
 * extended with NoComiss US fields. The user can regenerate from Supabase via:
 *   npx supabase gen types typescript --project-id <project-id> > src/lib/types/database.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type ListingStatus =
  | "draft"
  | "onboarding"
  | "ready"
  | "active"
  | "paused"
  | "under_offer"
  | "sold"
  | "expired";

export type MediaType = "photo" | "video" | "virtual_tour";

export type LeadFormType = "inquiry" | "showing" | "offer";
export type LeadOrigen =
  | "mini_site"
  | "direct_form"
  | "shared_link"
  | "ad"
  | "whatsapp"
  | "other";
export type CitaEstado = "programada" | "confirmada" | "cancelada" | "completada";
export type CitaTimeSlot = "morning" | "afternoon" | "evening";
export type OfertaEstado =
  | "submitted"
  | "reviewed"
  | "accepted"
  | "countered"
  | "rejected"
  | "withdrawn";
export type OfertaFinancing = "cash" | "conventional" | "fha" | "va" | "other";
export type OfertaPreApproved = "yes" | "no" | "pending";
export type NotificationType =
  | "content_nudge"
  | "new_lead"
  | "showing_scheduled"
  | "showing_reminder"
  | "offer_received"
  | "listing_published"
  | "milestone"
  | "system";

/**
 * `tipo_inmueble` is stored as a free-form string in the DB so it can hold both
 * Colombia values (apartamento, casa, apartaestudio, local, oficina, bodega)
 * and legacy US values (single_family, condo, townhouse, multi_family).
 */
export type PropertyType = string;

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.3";
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          nombre: string | null;
          rol: string | null;
          empresa_id: string | null;
          avatar_url: string | null;
          plan: string | null;
          onboarding_completed: boolean | null;
          metadata: Json | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          nombre?: string | null;
          rol?: string | null;
          empresa_id?: string | null;
          avatar_url?: string | null;
          plan?: string | null;
          onboarding_completed?: boolean | null;
          metadata?: Json | null;
        };
        Update: {
          id?: string;
          email?: string;
          nombre?: string | null;
          rol?: string | null;
          empresa_id?: string | null;
          avatar_url?: string | null;
          plan?: string | null;
          onboarding_completed?: boolean | null;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      empresas: {
        Row: {
          id: string;
          nombre: string;
          plan: string | null;
          activa: boolean | null;
          configuracion: Json | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          nombre: string;
          plan?: string | null;
          activa?: boolean | null;
          configuracion?: Json | null;
        };
        Update: {
          id?: string;
          nombre?: string;
          plan?: string | null;
          activa?: boolean | null;
          configuracion?: Json | null;
        };
        Relationships: [];
      };
      propiedades: {
        Row: {
          id: string;
          empresa_id: string;
          codigo: string | null;
          ubicacion: string | null;
          ciudad: string | null;
          tipo_inmueble: PropertyType | null;
          tipo_negocio: string | null;
          precio: number | null;
          descripcion: string | null;
          habitaciones: number | null;
          banos: number | null;
          parqueaderos: number | null;
          imagenes: string[] | null;
          metadata: Json | null;
          source: string | null;
          slug: string | null;
          address_line1: string | null;
          address_line2: string | null;
          state: string | null;
          zip_code: string | null;
          country: string | null;
          sqft: number | null;
          lot_sqft: number | null;
          year_built: number | null;
          stories: number | null;
          garage_spaces: number | null;
          hoa_monthly: number | null;
          currency: string | null;
          seller_story: string | null;
          description_short: string | null;
          listing_status: ListingStatus | null;
          onboarding_step: number | null;
          published_at: string | null;
          sold_at: string | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          codigo?: string | null;
          ubicacion?: string | null;
          ciudad?: string | null;
          tipo_inmueble?: PropertyType | null;
          tipo_negocio?: string | null;
          precio?: number | null;
          descripcion?: string | null;
          habitaciones?: number | null;
          banos?: number | null;
          parqueaderos?: number | null;
          imagenes?: string[] | null;
          metadata?: Json | null;
          source?: string | null;
          slug?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          state?: string | null;
          zip_code?: string | null;
          country?: string | null;
          sqft?: number | null;
          lot_sqft?: number | null;
          year_built?: number | null;
          stories?: number | null;
          garage_spaces?: number | null;
          hoa_monthly?: number | null;
          currency?: string | null;
          seller_story?: string | null;
          description_short?: string | null;
          listing_status?: ListingStatus | null;
          onboarding_step?: number | null;
          published_at?: string | null;
          sold_at?: string | null;
        };
        Update: {
          id?: string;
          empresa_id?: string;
          codigo?: string | null;
          ubicacion?: string | null;
          ciudad?: string | null;
          tipo_inmueble?: PropertyType | null;
          tipo_negocio?: string | null;
          precio?: number | null;
          descripcion?: string | null;
          habitaciones?: number | null;
          banos?: number | null;
          parqueaderos?: number | null;
          imagenes?: string[] | null;
          metadata?: Json | null;
          source?: string | null;
          slug?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          state?: string | null;
          zip_code?: string | null;
          country?: string | null;
          sqft?: number | null;
          lot_sqft?: number | null;
          year_built?: number | null;
          stories?: number | null;
          garage_spaces?: number | null;
          hoa_monthly?: number | null;
          currency?: string | null;
          seller_story?: string | null;
          description_short?: string | null;
          listing_status?: ListingStatus | null;
          onboarding_step?: number | null;
          published_at?: string | null;
          sold_at?: string | null;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          empresa_id: string;
          propiedad_interes_id: string | null;
          nombre: string;
          email: string;
          telefono: string | null;
          origen: LeadOrigen;
          form_type: LeadFormType;
          mensaje: string | null;
          pre_approved: boolean | null;
          budget_range: string | null;
          timeline: string | null;
          utm_source: string | null;
          utm_medium: string | null;
          utm_campaign: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          propiedad_interes_id?: string | null;
          nombre: string;
          email: string;
          telefono?: string | null;
          origen?: LeadOrigen;
          form_type: LeadFormType;
          mensaje?: string | null;
          pre_approved?: boolean | null;
          budget_range?: string | null;
          timeline?: string | null;
          utm_source?: string | null;
          utm_medium?: string | null;
          utm_campaign?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["leads"]["Insert"]>;
        Relationships: [];
      };
      citas: {
        Row: {
          id: string;
          empresa_id: string;
          propiedad_id: string;
          lead_id: string | null;
          nombre: string;
          email: string;
          telefono: string | null;
          preferred_date: string | null;
          preferred_time: CitaTimeSlot | null;
          estado: CitaEstado;
          notas: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          propiedad_id: string;
          lead_id?: string | null;
          nombre: string;
          email: string;
          telefono?: string | null;
          preferred_date?: string | null;
          preferred_time?: CitaTimeSlot | null;
          estado?: CitaEstado;
          notas?: string | null;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["citas"]["Insert"]>;
        Relationships: [];
      };
      ofertas: {
        Row: {
          id: string;
          empresa_id: string;
          propiedad_id: string;
          lead_id: string | null;
          nombre: string;
          email: string;
          telefono: string | null;
          offer_price: number;
          earnest_money: number | null;
          financing: OfertaFinancing | null;
          pre_approved: OfertaPreApproved | null;
          closing_date: string | null;
          contingencies: string[];
          notas: string | null;
          estado: OfertaEstado;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id: string;
          propiedad_id: string;
          lead_id?: string | null;
          nombre: string;
          email: string;
          telefono?: string | null;
          offer_price: number;
          earnest_money?: number | null;
          financing?: OfertaFinancing | null;
          pre_approved?: OfertaPreApproved | null;
          closing_date?: string | null;
          contingencies?: string[];
          notas?: string | null;
          estado?: OfertaEstado;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["ofertas"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          empresa_id: string | null;
          user_id: string | null;
          type: NotificationType;
          title: string;
          body: string | null;
          action_url: string | null;
          read: boolean;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          empresa_id?: string | null;
          user_id?: string | null;
          type: NotificationType;
          title: string;
          body?: string | null;
          action_url?: string | null;
          read?: boolean;
          metadata?: Json;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      propiedad_media: {
        Row: {
          id: string;
          propiedad_id: string;
          empresa_id: string;
          uploaded_by: string | null;
          media_type: MediaType;
          storage_path: string;
          public_url: string | null;
          thumbnail_url: string | null;
          room_tag: string | null;
          caption: string | null;
          sort_order: number | null;
          is_hero: boolean | null;
          file_size_bytes: number | null;
          mime_type: string | null;
          width: number | null;
          height: number | null;
          duration_seconds: number | null;
          created_at: string;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          propiedad_id: string;
          empresa_id: string;
          uploaded_by?: string | null;
          media_type: MediaType;
          storage_path: string;
          public_url?: string | null;
          thumbnail_url?: string | null;
          room_tag?: string | null;
          caption?: string | null;
          sort_order?: number | null;
          is_hero?: boolean | null;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          duration_seconds?: number | null;
        };
        Update: {
          id?: string;
          propiedad_id?: string;
          empresa_id?: string;
          uploaded_by?: string | null;
          media_type?: MediaType;
          storage_path?: string;
          public_url?: string | null;
          thumbnail_url?: string | null;
          room_tag?: string | null;
          caption?: string | null;
          sort_order?: number | null;
          is_hero?: boolean | null;
          file_size_bytes?: number | null;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          duration_seconds?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Empresa = Database["public"]["Tables"]["empresas"]["Row"];
export type Propiedad = Database["public"]["Tables"]["propiedades"]["Row"];
export type PropiedadMedia = Database["public"]["Tables"]["propiedad_media"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type Cita = Database["public"]["Tables"]["citas"]["Row"];
export type Oferta = Database["public"]["Tables"]["ofertas"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
