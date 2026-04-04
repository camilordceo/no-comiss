export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          subscription_tier: "starter" | "pro" | "elite" | null;
          subscription_status: "active" | "past_due" | "cancelled" | null;
          subscription_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          subscription_tier?: "starter" | "pro" | "elite" | null;
          subscription_status?: "active" | "past_due" | "cancelled" | null;
          subscription_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          subscription_tier?: "starter" | "pro" | "elite" | null;
          subscription_status?: "active" | "past_due" | "cancelled" | null;
          subscription_id?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      listings: {
        Row: {
          id: string;
          user_id: string;
          slug: string;
          status: "draft" | "active" | "paused" | "sold" | "expired";
          property_type: "apartment" | "house" | "studio" | "commercial" | "land";
          title: string;
          description: string | null;
          address: string;
          city: string;
          neighborhood: string | null;
          price: number;
          area_m2: number;
          bedrooms: number | null;
          bathrooms: number | null;
          parking: number | null;
          floor: number | null;
          stratum: number | null;
          amenities: string[];
          photos: string[];
          video_url: string | null;
          rentcast_data: Json | null;
          ai_descriptions: Json | null;
          selected_description_idx: number;
          views_count: number;
          leads_count: number;
          created_at: string;
          updated_at: string;
          published_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          slug: string;
          status?: "draft" | "active" | "paused" | "sold" | "expired";
          property_type: "apartment" | "house" | "studio" | "commercial" | "land";
          title: string;
          description?: string | null;
          address: string;
          city: string;
          neighborhood?: string | null;
          price: number;
          area_m2: number;
          bedrooms?: number | null;
          bathrooms?: number | null;
          parking?: number | null;
          floor?: number | null;
          stratum?: number | null;
          amenities?: string[];
          photos?: string[];
          video_url?: string | null;
          rentcast_data?: Json | null;
          ai_descriptions?: Json | null;
          selected_description_idx?: number;
          views_count?: number;
          leads_count?: number;
          published_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          slug?: string;
          status?: "draft" | "active" | "paused" | "sold" | "expired";
          property_type?: "apartment" | "house" | "studio" | "commercial" | "land";
          title?: string;
          description?: string | null;
          address?: string;
          city?: string;
          neighborhood?: string | null;
          price?: number;
          area_m2?: number;
          bedrooms?: number | null;
          bathrooms?: number | null;
          parking?: number | null;
          floor?: number | null;
          stratum?: number | null;
          amenities?: string[];
          photos?: string[];
          video_url?: string | null;
          rentcast_data?: Json | null;
          ai_descriptions?: Json | null;
          selected_description_idx?: number;
          views_count?: number;
          leads_count?: number;
          published_at?: string | null;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          id: string;
          listing_id: string;
          user_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          message: string | null;
          status: "new" | "contacted" | "showing_scheduled" | "offer_made" | "closed" | "lost";
          source: "web" | "whatsapp" | "instagram" | "facebook" | "portal";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          user_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          message?: string | null;
          status?: "new" | "contacted" | "showing_scheduled" | "offer_made" | "closed" | "lost";
          source?: "web" | "whatsapp" | "instagram" | "facebook" | "portal";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          listing_id?: string;
          user_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          message?: string | null;
          status?: "new" | "contacted" | "showing_scheduled" | "offer_made" | "closed" | "lost";
          source?: "web" | "whatsapp" | "instagram" | "facebook" | "portal";
        };
        Relationships: [];
      };
      showings: {
        Row: {
          id: string;
          listing_id: string;
          lead_id: string;
          scheduled_at: string;
          status: "pending" | "confirmed" | "completed" | "cancelled";
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          lead_id: string;
          scheduled_at: string;
          status?: "pending" | "confirmed" | "completed" | "cancelled";
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          listing_id?: string;
          lead_id?: string;
          scheduled_at?: string;
          status?: "pending" | "confirmed" | "completed" | "cancelled";
          notes?: string | null;
        };
        Relationships: [];
      };
      offers: {
        Row: {
          id: string;
          listing_id: string;
          lead_id: string;
          amount: number;
          status: "pending" | "countered" | "accepted" | "rejected";
          conditions: string | null;
          ai_analysis: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          lead_id: string;
          amount: number;
          status?: "pending" | "countered" | "accepted" | "rejected";
          conditions?: string | null;
          ai_analysis?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          listing_id?: string;
          lead_id?: string;
          amount?: number;
          status?: "pending" | "countered" | "accepted" | "rejected";
          conditions?: string | null;
          ai_analysis?: Json | null;
        };
        Relationships: [];
      };
      calculator_leads: {
        Row: {
          id: string;
          email: string;
          home_value: number;
          city: string;
          traditional_commission: number;
          savings_estimate: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          home_value: number;
          city: string;
          traditional_commission: number;
          savings_estimate: number;
          created_at?: string;
        };
        Update: {
          email?: string;
          home_value?: number;
          city?: string;
          traditional_commission?: number;
          savings_estimate?: number;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_views_count: {
        Args: { listing_id: string };
        Returns: void;
      };
      increment_leads_count: {
        Args: { listing_id: string };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
};

// Convenience type aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Listing = Database["public"]["Tables"]["listings"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type Showing = Database["public"]["Tables"]["showings"]["Row"];
export type Offer = Database["public"]["Tables"]["offers"]["Row"];
export type CalculatorLead = Database["public"]["Tables"]["calculator_leads"]["Row"];
