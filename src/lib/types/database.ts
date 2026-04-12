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
          bio: string | null;
          tiktok_handle: string | null;
          instagram_handle: string | null;
          profile_completion_score: number;
          referral_code: string | null;
          subscription_tier: "starter" | "pro" | "elite" | null;
          subscription_status: "active" | "past_due" | "cancelled" | null;
          subscription_id: string | null;
          plan: string | null;
          credits_remaining: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          tiktok_handle?: string | null;
          instagram_handle?: string | null;
          profile_completion_score?: number;
          referral_code?: string | null;
          subscription_tier?: "starter" | "pro" | "elite" | null;
          subscription_status?: "active" | "past_due" | "cancelled" | null;
          subscription_id?: string | null;
          plan?: string | null;
          credits_remaining?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          phone?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          tiktok_handle?: string | null;
          instagram_handle?: string | null;
          profile_completion_score?: number;
          referral_code?: string | null;
          subscription_tier?: "starter" | "pro" | "elite" | null;
          subscription_status?: "active" | "past_due" | "cancelled" | null;
          subscription_id?: string | null;
          plan?: string | null;
          credits_remaining?: number | null;
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
          property_type: "single_family" | "condo" | "townhouse" | "multi_family" | "apartment" | "house" | "studio" | "commercial" | "land";
          title: string;
          description: string | null;
          seller_story: string | null;
          address: string;
          city: string;
          state: string | null;
          zip_code: string | null;
          neighborhood: string | null;
          price: number;
          // US fields (sqft)
          sqft: number | null;
          lot_sqft: number | null;
          year_built: number | null;
          stories: number | null;
          garage_spaces: number | null;
          hoa_monthly: number | null;
          // legacy / shared
          area_m2: number | null;
          bedrooms: number | null;
          bathrooms: number | null;
          parking: number | null;
          floor: number | null;
          stratum: number | null;
          amenities: string[];
          photos: string[];
          photo_rooms: string[];
          hero_photo_idx: number;
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
          property_type: "single_family" | "condo" | "townhouse" | "multi_family" | "apartment" | "house" | "studio" | "commercial" | "land";
          title: string;
          description?: string | null;
          seller_story?: string | null;
          address: string;
          city?: string;
          state?: string | null;
          zip_code?: string | null;
          neighborhood?: string | null;
          price?: number;
          sqft?: number | null;
          lot_sqft?: number | null;
          year_built?: number | null;
          stories?: number | null;
          garage_spaces?: number | null;
          hoa_monthly?: number | null;
          area_m2?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          parking?: number | null;
          floor?: number | null;
          stratum?: number | null;
          amenities?: string[];
          photos?: string[];
          photo_rooms?: string[];
          hero_photo_idx?: number;
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
          property_type?: "single_family" | "condo" | "townhouse" | "multi_family" | "apartment" | "house" | "studio" | "commercial" | "land";
          title?: string;
          description?: string | null;
          seller_story?: string | null;
          address?: string;
          city?: string;
          state?: string | null;
          zip_code?: string | null;
          neighborhood?: string | null;
          price?: number;
          sqft?: number | null;
          lot_sqft?: number | null;
          year_built?: number | null;
          stories?: number | null;
          garage_spaces?: number | null;
          hoa_monthly?: number | null;
          area_m2?: number | null;
          bedrooms?: number | null;
          bathrooms?: number | null;
          parking?: number | null;
          floor?: number | null;
          stratum?: number | null;
          amenities?: string[];
          photos?: string[];
          photo_rooms?: string[];
          hero_photo_idx?: number;
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
          seller_id: string;
          lead_id: string | null;
          buyer_profile_id: string | null;
          negotiation_id: string | null;
          buyer_name: string;
          buyer_email: string | null;
          buyer_phone: string | null;
          scheduled_at: string;
          duration_minutes: number;
          status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
          google_event_id: string | null;
          google_meet_link: string | null;
          calendly_event_uri: string | null;
          calendly_invitee_uri: string | null;
          seller_notes: string | null;
          buyer_notes: string | null;
          feedback: string | null;
          reminder_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          seller_id: string;
          lead_id?: string | null;
          buyer_profile_id?: string | null;
          negotiation_id?: string | null;
          buyer_name: string;
          buyer_email?: string | null;
          buyer_phone?: string | null;
          scheduled_at: string;
          duration_minutes?: number;
          status?: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
          google_event_id?: string | null;
          google_meet_link?: string | null;
          calendly_event_uri?: string | null;
          calendly_invitee_uri?: string | null;
          seller_notes?: string | null;
          buyer_notes?: string | null;
          feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
          google_event_id?: string | null;
          google_meet_link?: string | null;
          seller_notes?: string | null;
          feedback?: string | null;
          updated_at?: string;
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
      interested_sellers: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string | null;
          address_or_zip: string;
          home_value_range: string | null;
          timeline: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone?: string | null;
          address_or_zip: string;
          home_value_range?: string | null;
          timeline?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          full_name?: string;
          email?: string;
          phone?: string | null;
          address_or_zip?: string;
          home_value_range?: string | null;
          timeline?: string | null;
          source?: string | null;
        };
        Relationships: [];
      };
      content_pieces: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string;
          topic: string;
          content: string | null;
          reading_time_minutes: number;
          status: "draft" | "published" | "archived";
          published_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          excerpt: string;
          topic: string;
          content?: string | null;
          reading_time_minutes?: number;
          status?: "draft" | "published" | "archived";
          published_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          slug?: string;
          title?: string;
          excerpt?: string;
          topic?: string;
          content?: string | null;
          reading_time_minutes?: number;
          status?: "draft" | "published" | "archived";
          published_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          user_id: string;
          wompi_transaction_id: string | null;
          wompi_reference: string;
          amount_cents: number;
          currency: string;
          status: "pending" | "approved" | "declined" | "voided" | "error";
          plan_id: "starter" | "pro" | "elite";
          plan_name: string;
          wompi_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wompi_transaction_id?: string | null;
          wompi_reference: string;
          amount_cents: number;
          currency?: string;
          status?: "pending" | "approved" | "declined" | "voided" | "error";
          plan_id: "starter" | "pro" | "elite";
          plan_name: string;
          wompi_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          wompi_transaction_id?: string | null;
          status?: "pending" | "approved" | "declined" | "voided" | "error";
          wompi_data?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_media: {
        Row: {
          id: string;
          user_id: string;
          listing_id: string | null;
          media_type: "photo" | "video" | "document" | "avatar";
          bucket: string;
          storage_path: string;
          public_url: string | null;
          file_name: string;
          file_size: number | null;
          mime_type: string | null;
          width: number | null;
          height: number | null;
          duration_seconds: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          listing_id?: string | null;
          media_type: "photo" | "video" | "document" | "avatar";
          bucket: string;
          storage_path: string;
          public_url?: string | null;
          file_name: string;
          file_size?: number | null;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          duration_seconds?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          public_url?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      buyer_profiles: {
        Row: {
          id: string;
          user_id: string | null;
          name: string;
          email: string;
          phone: string | null;
          whatsapp: string | null;
          budget_min: number | null;
          budget_max: number | null;
          preferred_cities: string[];
          preferred_types: string[];
          min_bedrooms: number | null;
          min_area_m2: number | null;
          financing_type: "cash" | "mortgage" | "leasing" | "undecided" | null;
          pre_approved: boolean;
          buying_timeline: "immediate" | "1_3_months" | "3_6_months" | "6_plus_months" | null;
          status: "active" | "paused" | "closed";
          notes: string | null;
          source: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          name: string;
          email: string;
          phone?: string | null;
          whatsapp?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          preferred_cities?: string[];
          preferred_types?: string[];
          min_bedrooms?: number | null;
          min_area_m2?: number | null;
          financing_type?: "cash" | "mortgage" | "leasing" | "undecided" | null;
          pre_approved?: boolean;
          buying_timeline?: "immediate" | "1_3_months" | "3_6_months" | "6_plus_months" | null;
          status?: "active" | "paused" | "closed";
          notes?: string | null;
          source?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          email?: string;
          phone?: string | null;
          budget_min?: number | null;
          budget_max?: number | null;
          preferred_cities?: string[];
          preferred_types?: string[];
          status?: "active" | "paused" | "closed";
          updated_at?: string;
        };
        Relationships: [];
      };
      negotiations: {
        Row: {
          id: string;
          listing_id: string;
          seller_id: string;
          buyer_id: string | null;
          buyer_profile_id: string | null;
          lead_id: string | null;
          status: "inquiry" | "showing_scheduled" | "showing_done" | "offer_made" | "countered" | "accepted" | "due_diligence" | "closed_won" | "closed_lost";
          initial_offer: number | null;
          final_price: number | null;
          offer_date: string | null;
          accepted_date: string | null;
          closing_date: string | null;
          seller_notes: string | null;
          buyer_notes: string | null;
          ai_analysis: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          seller_id: string;
          buyer_id?: string | null;
          buyer_profile_id?: string | null;
          lead_id?: string | null;
          status?: "inquiry" | "showing_scheduled" | "showing_done" | "offer_made" | "countered" | "accepted" | "due_diligence" | "closed_won" | "closed_lost";
          initial_offer?: number | null;
          final_price?: number | null;
          seller_notes?: string | null;
          buyer_notes?: string | null;
          ai_analysis?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: "inquiry" | "showing_scheduled" | "showing_done" | "offer_made" | "countered" | "accepted" | "due_diligence" | "closed_won" | "closed_lost";
          initial_offer?: number | null;
          final_price?: number | null;
          seller_notes?: string | null;
          buyer_notes?: string | null;
          ai_analysis?: Json | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      calendar_connections: {
        Row: {
          id: string;
          user_id: string;
          provider: "google" | "calendly";
          google_access_token: string | null;
          google_refresh_token: string | null;
          google_token_expiry: string | null;
          google_calendar_id: string | null;
          google_email: string | null;
          calendly_api_key: string | null;
          calendly_scheduling_url: string | null;
          calendly_user_uri: string | null;
          connected: boolean;
          scopes: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          provider?: "google" | "calendly";
          google_access_token?: string | null;
          google_refresh_token?: string | null;
          google_token_expiry?: string | null;
          google_calendar_id?: string | null;
          google_email?: string | null;
          calendly_api_key?: string | null;
          calendly_scheduling_url?: string | null;
          calendly_user_uri?: string | null;
          connected?: boolean;
          scopes?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          google_access_token?: string | null;
          google_refresh_token?: string | null;
          google_token_expiry?: string | null;
          google_email?: string | null;
          calendly_scheduling_url?: string | null;
          connected?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          id: string;
          user_id: string;
          email_enabled: boolean;
          whatsapp_enabled: boolean;
          sms_enabled: boolean;
          new_lead: boolean;
          showing_scheduled: boolean;
          showing_reminder: boolean;
          offer_received: boolean;
          negotiation_update: boolean;
          payment_confirmed: boolean;
          weekly_summary: boolean;
          notify_email: string | null;
          notify_phone: string | null;
          notify_whatsapp: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_enabled?: boolean;
          whatsapp_enabled?: boolean;
          sms_enabled?: boolean;
          new_lead?: boolean;
          showing_scheduled?: boolean;
          showing_reminder?: boolean;
          offer_received?: boolean;
          negotiation_update?: boolean;
          payment_confirmed?: boolean;
          weekly_summary?: boolean;
          notify_email?: string | null;
          notify_phone?: string | null;
          notify_whatsapp?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email_enabled?: boolean;
          whatsapp_enabled?: boolean;
          sms_enabled?: boolean;
          new_lead?: boolean;
          showing_scheduled?: boolean;
          offer_received?: boolean;
          notify_email?: string | null;
          notify_phone?: string | null;
          notify_whatsapp?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      payment_sources: {
        Row: {
          id: string;
          user_id: string;
          wompi_payment_source_id: number;
          card_last_four: string | null;
          card_brand: string | null;
          is_default: boolean;
          is_three_ds: boolean;
          status: "AVAILABLE" | "PENDING" | "DECLINED" | "ERROR";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          wompi_payment_source_id: number;
          card_last_four?: string | null;
          card_brand?: string | null;
          is_default?: boolean;
          is_three_ds?: boolean;
          status?: "AVAILABLE" | "PENDING" | "DECLINED" | "ERROR";
          created_at?: string;
        };
        Update: {
          status?: "AVAILABLE" | "PENDING" | "DECLINED" | "ERROR";
          is_default?: boolean;
        };
        Relationships: [];
      };
      wompi_transactions: {
        Row: {
          id: string;
          user_id: string | null;
          wompi_transaction_id: string | null;
          reference: string;
          amount_in_cents: number;
          currency: string;
          status: "PENDING" | "APPROVED" | "DECLINED" | "ERROR" | "VOIDED";
          payment_source_id: number | null;
          payment_method_type: string;
          plan: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          wompi_transaction_id?: string | null;
          reference: string;
          amount_in_cents: number;
          currency?: string;
          status?: "PENDING" | "APPROVED" | "DECLINED" | "ERROR" | "VOIDED";
          payment_source_id?: number | null;
          payment_method_type?: string;
          plan?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          wompi_transaction_id?: string | null;
          status?: "PENDING" | "APPROVED" | "DECLINED" | "ERROR" | "VOIDED";
          metadata?: Json;
          updated_at?: string;
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
export type InterestedSeller = Database["public"]["Tables"]["interested_sellers"]["Row"];
export type ContentPiece = Database["public"]["Tables"]["content_pieces"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type BuyerProfile = Database["public"]["Tables"]["buyer_profiles"]["Row"];
export type Negotiation = Database["public"]["Tables"]["negotiations"]["Row"];
export type CalendarConnection = Database["public"]["Tables"]["calendar_connections"]["Row"];
export type NotificationPreferences = Database["public"]["Tables"]["notification_preferences"]["Row"];
export type PaymentSource = Database["public"]["Tables"]["payment_sources"]["Row"];
export type WompiTransaction = Database["public"]["Tables"]["wompi_transactions"]["Row"];
