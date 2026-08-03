export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      advisor_notifications: {
        Row: {
          channel: string
          id: number
          lead_id: string
          payload: Json
          send_after: string
          sent_at: string | null
          status: string
        }
        Insert: {
          channel?: string
          id?: never
          lead_id: string
          payload: Json
          send_after: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          channel?: string
          id?: never
          lead_id?: string
          payload?: Json
          send_after?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "advisor_notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generations: {
        Row: {
          business_id: string
          cost_cents: number
          created_at: string
          error: string | null
          id: string
          output_text: string | null
          output_url: string | null
          params: Json
          prompt: string | null
          source: string
          status: string
          tokens_used: number
          tool: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          cost_cents?: number
          created_at?: string
          error?: string | null
          id?: string
          output_text?: string | null
          output_url?: string | null
          params?: Json
          prompt?: string | null
          source?: string
          status?: string
          tokens_used?: number
          tool: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          cost_cents?: number
          created_at?: string
          error?: string | null
          id?: string
          output_text?: string | null
          output_url?: string | null
          params?: Json
          prompt?: string | null
          source?: string
          status?: string
          tokens_used?: number
          tool?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          actor_id: string | null
          business_id: string | null
          created_at: string
          details: Json
          entity_id: string | null
          entity_type: string | null
          id: string
          ip: unknown
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          business_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: unknown
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          business_id?: string | null
          created_at?: string
          details?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip?: unknown
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_kits: {
        Row: {
          accent_color: string | null
          business_id: string
          created_at: string
          font_family: string | null
          id: string
          logo_url: string | null
          primary_color: string
          secondary_color: string
          updated_at: string
          watermark_disabled: boolean
        }
        Insert: {
          accent_color?: string | null
          business_id: string
          created_at?: string
          font_family?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          updated_at?: string
          watermark_disabled?: boolean
        }
        Update: {
          accent_color?: string | null
          business_id?: string
          created_at?: string
          font_family?: string | null
          id?: string
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          updated_at?: string
          watermark_disabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "brand_kits_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      business_memberships: {
        Row: {
          business_id: string
          created_at: string
          id: string
          invited_by: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          invited_by?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_memberships_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      businesses: {
        Row: {
          ai_monthly_limit: number
          created_at: string
          demo_data_seeded_at: string | null
          id: string
          name: string
          timezone: string
          updated_at: string
        }
        Insert: {
          ai_monthly_limit?: number
          created_at?: string
          demo_data_seeded_at?: string | null
          id?: string
          name: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          ai_monthly_limit?: number
          created_at?: string
          demo_data_seeded_at?: string | null
          id?: string
          name?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      content: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          file_size_bytes: number | null
          file_url: string | null
          id: string
          name: string
          thumbnail_status: string | null
          thumbnail_url: string | null
          type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          name: string
          thumbnail_status?: string | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          file_size_bytes?: number | null
          file_url?: string | null
          id?: string
          name?: string
          thumbnail_status?: string | null
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          business_id: string
          category: string
          content_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          price: number | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          business_id: string
          category?: string
          content_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          price?: number | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          category?: string
          content_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          price?: number | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_items_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_screen_uptime: {
        Row: {
          created_at: string
          day: string
          minutes_expected: number
          minutes_online: number
          screen_id: string
        }
        Insert: {
          created_at?: string
          day: string
          minutes_expected?: number
          minutes_online?: number
          screen_id: string
        }
        Update: {
          created_at?: string
          day?: string
          minutes_expected?: number
          minutes_online?: number
          screen_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_screen_uptime_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          business_name: string
          city: string
          consent: boolean
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string
          screens_range: string
        }
        Insert: {
          business_name: string
          city: string
          consent?: boolean
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone: string
          screens_range: string
        }
        Update: {
          business_name?: string
          city?: string
          consent?: boolean
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string
          screens_range?: string
        }
        Relationships: []
      }
      device_offline_events: {
        Row: {
          business_id: string
          came_online_at: string | null
          created_at: string
          device_id: string
          duration_seconds: number | null
          id: string
          went_offline_at: string
        }
        Insert: {
          business_id: string
          came_online_at?: string | null
          created_at?: string
          device_id: string
          duration_seconds?: number | null
          id?: string
          went_offline_at?: string
        }
        Update: {
          business_id?: string
          came_online_at?: string | null
          created_at?: string
          device_id?: string
          duration_seconds?: number | null
          id?: string
          went_offline_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_offline_events_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_offline_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_orders: {
        Row: {
          address: string
          business_id: string
          city: string
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          included: boolean
          model_id: string | null
          model_name: string | null
          notes: string | null
          price_cop: number
          requested_by: string | null
          screen_id: string | null
          status: string
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          address: string
          business_id: string
          city: string
          contact_name: string
          contact_phone: string
          created_at?: string
          id?: string
          included?: boolean
          model_id?: string | null
          model_name?: string | null
          notes?: string | null
          price_cop?: number
          requested_by?: string | null
          screen_id?: string | null
          status?: string
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          address?: string
          business_id?: string
          city?: string
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          included?: boolean
          model_id?: string | null
          model_name?: string | null
          notes?: string | null
          price_cop?: number
          requested_by?: string | null
          screen_id?: string | null
          status?: string
          tracking_code?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_orders_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_orders_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          address: string | null
          app_version: string | null
          business_id: string
          code_expires_at: string | null
          code_source: string | null
          created_at: string
          device_code: string
          heartbeat_token: string | null
          id: string
          ip: unknown
          last_seen_at: string | null
          latitude: number | null
          location_id: string | null
          longitude: number | null
          network_type: string | null
          paired_at: string | null
          resolution: string | null
          screen_id: string | null
          screen_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          app_version?: string | null
          business_id: string
          code_expires_at?: string | null
          code_source?: string | null
          created_at?: string
          device_code: string
          heartbeat_token?: string | null
          id?: string
          ip?: unknown
          last_seen_at?: string | null
          latitude?: number | null
          location_id?: string | null
          longitude?: number | null
          network_type?: string | null
          paired_at?: string | null
          resolution?: string | null
          screen_id?: string | null
          screen_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          app_version?: string | null
          business_id?: string
          code_expires_at?: string | null
          code_source?: string | null
          created_at?: string
          device_code?: string
          heartbeat_token?: string | null
          id?: string
          ip?: unknown
          last_seen_at?: string | null
          latitude?: number | null
          location_id?: string | null
          longitude?: number | null
          network_type?: string | null
          paired_at?: string | null
          resolution?: string | null
          screen_id?: string | null
          screen_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "devices_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          business_id: string
          created_at: string
          currency: string
          due_date: string
          id: string
          invoice_number: string
          notes: string | null
          paid_at: string | null
          pdf_url: string | null
          status: string
          subscription_id: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          invoice_number: string
          notes?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          status?: string
          subscription_id: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          invoice_number?: string
          notes?: string | null
          paid_at?: string | null
          pdf_url?: string | null
          status?: string
          subscription_id?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      landing_brand_checks: {
        Row: {
          brand_id: string
          created_at: string
          id: string
          path: string | null
          verdict: string
          visitor_id: string | null
        }
        Insert: {
          brand_id: string
          created_at?: string
          id?: string
          path?: string | null
          verdict: string
          visitor_id?: string | null
        }
        Update: {
          brand_id?: string
          created_at?: string
          id?: string
          path?: string | null
          verdict?: string
          visitor_id?: string | null
        }
        Relationships: []
      }
      lead_events: {
        Row: {
          answer: string | null
          created_at: string | null
          id: number
          lead_id: string
          step: string
        }
        Insert: {
          answer?: string | null
          created_at?: string | null
          id?: never
          lead_id: string
          step: string
        }
        Update: {
          answer?: string | null
          created_at?: string | null
          id?: never
          lead_id?: string
          step?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          budget: string | null
          city: string | null
          company: string | null
          consent_at: string | null
          consent_text: string | null
          consent_version: string | null
          created_at: string | null
          email: string | null
          fbclid: string | null
          gclid: string | null
          goal: string | null
          id: string
          inquiry: string | null
          landing_path: string | null
          name: string | null
          needs_device: boolean | null
          phone: string | null
          plan: string | null
          preferred_contact: string | null
          preferred_time: string | null
          referrer: string | null
          screens: number
          source: string
          status: string
          ttclid: string | null
          tv_brand: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          whatsapp: string | null
        }
        Insert: {
          budget?: string | null
          city?: string | null
          company?: string | null
          consent_at?: string | null
          consent_text?: string | null
          consent_version?: string | null
          created_at?: string | null
          email?: string | null
          fbclid?: string | null
          gclid?: string | null
          goal?: string | null
          id?: string
          inquiry?: string | null
          landing_path?: string | null
          name?: string | null
          needs_device?: boolean | null
          phone?: string | null
          plan?: string | null
          preferred_contact?: string | null
          preferred_time?: string | null
          referrer?: string | null
          screens?: number
          source?: string
          status?: string
          ttclid?: string | null
          tv_brand?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          whatsapp?: string | null
        }
        Update: {
          budget?: string | null
          city?: string | null
          company?: string | null
          consent_at?: string | null
          consent_text?: string | null
          consent_version?: string | null
          created_at?: string | null
          email?: string | null
          fbclid?: string | null
          gclid?: string | null
          goal?: string | null
          id?: string
          inquiry?: string | null
          landing_path?: string | null
          name?: string | null
          needs_device?: boolean | null
          phone?: string | null
          plan?: string | null
          preferred_contact?: string | null
          preferred_time?: string | null
          referrer?: string | null
          screens?: number
          source?: string
          status?: string
          ttclid?: string | null
          tv_brand?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      legal_consents: {
        Row: {
          accepted_at: string
          context: string
          created_at: string
          id: string
          ip_address: string | null
          policy_version: string
          terms_version: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          context?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          policy_version: string
          terms_version: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          context?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          policy_version?: string
          terms_version?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string | null
          business_id: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_id: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_id?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_templates: {
        Row: {
          category: string
          created_at: string
          css: string
          description: string | null
          fields_schema: Json
          html_template: string
          id: string
          name: string
          thumbnail_url: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          css?: string
          description?: string | null
          fields_schema?: Json
          html_template: string
          id?: string
          name: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          css?: string
          description?: string | null
          fields_schema?: Json
          html_template?: string
          id?: string
          name?: string
          thumbnail_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pairing_attempts: {
        Row: {
          business_id_target: string | null
          created_at: string
          device_code_attempted: string | null
          id: string
          ip: unknown
          reason: string | null
          success: boolean
          user_agent: string | null
        }
        Insert: {
          business_id_target?: string | null
          created_at?: string
          device_code_attempted?: string | null
          id?: string
          ip?: unknown
          reason?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Update: {
          business_id_target?: string | null
          created_at?: string
          device_code_attempted?: string | null
          id?: string
          ip?: unknown
          reason?: string | null
          success?: boolean
          user_agent?: string | null
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          brand: string
          business_id: string
          created_at: string
          customer_email: string | null
          exp_month: number
          exp_year: number
          id: string
          is_default: boolean
          last4: string
          provider: string
          provider_ref: string | null
          token: string | null
          updated_at: string
        }
        Insert: {
          brand?: string
          business_id: string
          created_at?: string
          customer_email?: string | null
          exp_month?: number
          exp_year?: number
          id?: string
          is_default?: boolean
          last4?: string
          provider?: string
          provider_ref?: string | null
          token?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string
          business_id?: string
          created_at?: string
          customer_email?: string | null
          exp_month?: number
          exp_year?: number
          id?: string
          is_default?: boolean
          last4?: string
          provider?: string
          provider_ref?: string | null
          token?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_methods_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          billing_email: string | null
          billing_name: string | null
          business_id: string
          checkout_url: string | null
          created_at: string
          external_reference: string | null
          id: string
          invoice_id: string | null
          invoice_number: string
          metadata: Json
          payment_method: string | null
          payment_type: string
          provider: string
          provider_ref: string | null
          status: string
          subscription_id: string
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          billing_email?: string | null
          billing_name?: string | null
          business_id: string
          checkout_url?: string | null
          created_at?: string
          external_reference?: string | null
          id?: string
          invoice_id?: string | null
          invoice_number: string
          metadata?: Json
          payment_method?: string | null
          payment_type?: string
          provider?: string
          provider_ref?: string | null
          status?: string
          subscription_id: string
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          billing_email?: string | null
          billing_name?: string | null
          business_id?: string
          checkout_url?: string | null
          created_at?: string
          external_reference?: string | null
          id?: string
          invoice_id?: string | null
          invoice_number?: string
          metadata?: Json
          payment_method?: string | null
          payment_type?: string
          provider?: string
          provider_ref?: string | null
          status?: string
          subscription_id?: string
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admin_allowlist: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          granted_at: string
          granted_by: string | null
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      playback_events: {
        Row: {
          content_id: string | null
          created_at: string
          duration_ms: number
          id: number
          interrupted: boolean
          playlist_id: string | null
          screen_id: string
          started_at: string
        }
        Insert: {
          content_id?: string | null
          created_at?: string
          duration_ms: number
          id?: number
          interrupted?: boolean
          playlist_id?: string | null
          screen_id: string
          started_at: string
        }
        Update: {
          content_id?: string | null
          created_at?: string
          duration_ms?: number
          id?: number
          interrupted?: boolean
          playlist_id?: string | null
          screen_id?: string
          started_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playback_events_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playback_events_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playback_events_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_items: {
        Row: {
          content_id: string
          created_at: string
          duration_seconds: number
          id: string
          playlist_id: string
          sort_order: number
        }
        Insert: {
          content_id: string
          created_at?: string
          duration_seconds?: number
          id?: string
          playlist_id: string
          sort_order?: number
        }
        Update: {
          content_id?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          playlist_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "playlist_items_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playlist_items_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
        ]
      }
      playlists: {
        Row: {
          business_id: string
          created_at: string
          created_by: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playlists_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      pqrs: {
        Row: {
          business_id: string
          created_at: string
          created_by: string
          id: string
          message: string
          priority: string
          read_by_admin: boolean
          status: string
          subject: string
          type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by: string
          id?: string
          message: string
          priority?: string
          read_by_admin?: boolean
          status?: string
          subject: string
          type: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string
          id?: string
          message?: string
          priority?: string
          read_by_admin?: boolean
          status?: string
          subject?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pqrs_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      pqrs_responses: {
        Row: {
          author_id: string
          author_role: string
          created_at: string
          id: string
          message: string
          pqrs_id: string
        }
        Insert: {
          author_id: string
          author_role: string
          created_at?: string
          id?: string
          message: string
          pqrs_id: string
        }
        Update: {
          author_id?: string
          author_role?: string
          created_at?: string
          id?: string
          message?: string
          pqrs_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pqrs_responses_pqrs_id_fkey"
            columns: ["pqrs_id"]
            isOneToOne: false
            referencedRelation: "pqrs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          business_id: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          business_id?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      prorations: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          period_end: string
          period_start: string
          status: string
          subscription_item_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          period_end: string
          period_start: string
          status?: string
          subscription_item_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          period_end?: string
          period_start?: string
          status?: string
          subscription_item_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prorations_subscription_item_id_fkey"
            columns: ["subscription_item_id"]
            isOneToOne: false
            referencedRelation: "subscription_items"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_codes: {
        Row: {
          active: boolean
          business_id: string
          created_at: string
          id: string
          label: string
          screen_id: string | null
          slug: string
          target_url: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          business_id: string
          created_at?: string
          id?: string
          label: string
          screen_id?: string | null
          slug: string
          target_url: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          business_id?: string
          created_at?: string
          id?: string
          label?: string
          screen_id?: string | null
          slug?: string
          target_url?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "qr_codes_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_codes_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      qr_scans: {
        Row: {
          city: string | null
          country: string | null
          device_type: string | null
          id: string
          qr_code_id: string
          referrer: string | null
          scanned_at: string
          screen_id: string | null
          user_agent: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          device_type?: string | null
          id?: string
          qr_code_id: string
          referrer?: string | null
          scanned_at?: string
          screen_id?: string | null
          user_agent?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          device_type?: string | null
          id?: string
          qr_code_id?: string
          referrer?: string | null
          scanned_at?: string
          screen_id?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_scans_qr_code_id_fkey"
            columns: ["qr_code_id"]
            isOneToOne: false
            referencedRelation: "qr_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "qr_scans_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_blocks: {
        Row: {
          business_id: string
          created_at: string
          days_of_week: number[]
          end_date: string | null
          end_time: string
          id: string
          is_enabled: boolean
          layer_id: string
          name: string
          playlist_id: string
          recurrence: string | null
          screen_id: string
          start_date: string | null
          start_time: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          days_of_week?: number[]
          end_date?: string | null
          end_time: string
          id?: string
          is_enabled?: boolean
          layer_id: string
          name?: string
          playlist_id: string
          recurrence?: string | null
          screen_id: string
          start_date?: string | null
          start_time: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          days_of_week?: number[]
          end_date?: string | null
          end_time?: string
          id?: string
          is_enabled?: boolean
          layer_id?: string
          name?: string
          playlist_id?: string
          recurrence?: string | null
          screen_id?: string
          start_date?: string | null
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_blocks_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_layer_id_fkey"
            columns: ["layer_id"]
            isOneToOne: false
            referencedRelation: "schedule_layers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_blocks_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_layers: {
        Row: {
          business_id: string
          color: string
          created_at: string
          id: string
          name: string
          priority: number
          updated_at: string
        }
        Insert: {
          business_id: string
          color?: string
          created_at?: string
          id?: string
          name: string
          priority?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          color?: string
          created_at?: string
          id?: string
          name?: string
          priority?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_layers_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_publications: {
        Row: {
          business_id: string
          error: string | null
          id: string
          playing_at: string | null
          received_at: string | null
          schedule_version: number
          screen_id: string
          sent_at: string
          status: string
          updated_at: string
        }
        Insert: {
          business_id: string
          error?: string | null
          id?: string
          playing_at?: string | null
          received_at?: string | null
          schedule_version: number
          screen_id: string
          sent_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          error?: string | null
          id?: string
          playing_at?: string | null
          received_at?: string | null
          schedule_version?: number
          screen_id?: string
          sent_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_publications_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedule_publications_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      schedule_templates: {
        Row: {
          business_id: string
          created_at: string
          description: string | null
          id: string
          json_definition: Json
          name: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          description?: string | null
          id?: string
          json_definition?: Json
          name: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          description?: string | null
          id?: string
          json_definition?: Json
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedule_templates_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          created_at: string
          end_time: string | null
          id: string
          is_active: boolean
          playlist_id: string
          screen_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time?: string | null
          id?: string
          is_active?: boolean
          playlist_id: string
          screen_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string | null
          id?: string
          is_active?: boolean
          playlist_id?: string
          screen_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_playlist_id_fkey"
            columns: ["playlist_id"]
            isOneToOne: false
            referencedRelation: "playlists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      screen_commands: {
        Row: {
          command: string
          created_at: string
          executed_at: string | null
          expires_at: string | null
          id: string
          payload: Json | null
          result: Json | null
          screen_id: string
          status: string
        }
        Insert: {
          command: string
          created_at?: string
          executed_at?: string | null
          expires_at?: string | null
          id?: string
          payload?: Json | null
          result?: Json | null
          screen_id: string
          status?: string
        }
        Update: {
          command?: string
          created_at?: string
          executed_at?: string | null
          expires_at?: string | null
          id?: string
          payload?: Json | null
          result?: Json | null
          screen_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "screen_commands_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      screen_heartbeats: {
        Row: {
          app_version: string | null
          cpu_pct: number | null
          mem_pct: number | null
          net_kbps: number | null
          screen_id: string
          ts: string
        }
        Insert: {
          app_version?: string | null
          cpu_pct?: number | null
          mem_pct?: number | null
          net_kbps?: number | null
          screen_id: string
          ts?: string
        }
        Update: {
          app_version?: string | null
          cpu_pct?: number | null
          mem_pct?: number | null
          net_kbps?: number | null
          screen_id?: string
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "screen_heartbeats_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
        ]
      }
      screens: {
        Row: {
          activated_at: string | null
          app_version: string | null
          created_at: string
          device_model: string | null
          device_token: string | null
          device_type: string
          gps_accuracy: number | null
          gps_lat: number | null
          gps_lng: number | null
          gps_updated_at: string | null
          id: string
          ip_address: string | null
          ip_city: string | null
          ip_country: string | null
          ip_geo_for: string | null
          ip_geo_updated_at: string | null
          ip_lat: number | null
          ip_lng: number | null
          ip_region: string | null
          last_seen_at: string | null
          last_sync_at: string | null
          license_status: string
          location_id: string
          name: string
          os_version: string | null
          payment_expires_at: string | null
          rotation: number
          schedule_version: number
          status: string
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          activated_at?: string | null
          app_version?: string | null
          created_at?: string
          device_model?: string | null
          device_token?: string | null
          device_type?: string
          gps_accuracy?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          gps_updated_at?: string | null
          id?: string
          ip_address?: string | null
          ip_city?: string | null
          ip_country?: string | null
          ip_geo_for?: string | null
          ip_geo_updated_at?: string | null
          ip_lat?: number | null
          ip_lng?: number | null
          ip_region?: string | null
          last_seen_at?: string | null
          last_sync_at?: string | null
          license_status?: string
          location_id: string
          name: string
          os_version?: string | null
          payment_expires_at?: string | null
          rotation?: number
          schedule_version?: number
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          activated_at?: string | null
          app_version?: string | null
          created_at?: string
          device_model?: string | null
          device_token?: string | null
          device_type?: string
          gps_accuracy?: number | null
          gps_lat?: number | null
          gps_lng?: number | null
          gps_updated_at?: string | null
          id?: string
          ip_address?: string | null
          ip_city?: string | null
          ip_country?: string | null
          ip_geo_for?: string | null
          ip_geo_updated_at?: string | null
          ip_lat?: number | null
          ip_lng?: number | null
          ip_region?: string | null
          last_seen_at?: string | null
          last_sync_at?: string | null
          license_status?: string
          location_id?: string
          name?: string
          os_version?: string | null
          payment_expires_at?: string | null
          rotation?: number
          schedule_version?: number
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "screens_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "screens_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_items: {
        Row: {
          created_at: string
          ended_at: string | null
          id: string
          screen_id: string
          started_at: string
          status: string
          subscription_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          id?: string
          screen_id: string
          started_at?: string
          status?: string
          subscription_id: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          id?: string
          screen_id?: string
          started_at?: string
          status?: string
          subscription_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_items_screen_id_fkey"
            columns: ["screen_id"]
            isOneToOne: false
            referencedRelation: "screens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_items_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_anchor: string
          billing_cycle: string
          business_id: string
          created_at: string
          default_payment_method_id: string | null
          expires_at: string | null
          grace_period_ends_at: string | null
          id: string
          next_billing_date: string
          plan: string
          price_per_screen: number
          screens_count: number
          status: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          billing_anchor?: string
          billing_cycle?: string
          business_id: string
          created_at?: string
          default_payment_method_id?: string | null
          expires_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          next_billing_date?: string
          plan?: string
          price_per_screen?: number
          screens_count?: number
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          billing_anchor?: string
          billing_cycle?: string
          business_id?: string
          created_at?: string
          default_payment_method_id?: string | null
          expires_at?: string | null
          grace_period_ends_at?: string | null
          id?: string
          next_billing_date?: string
          plan?: string
          price_per_screen?: number
          screens_count?: number
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_default_payment_method_id_fkey"
            columns: ["default_payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      support_messages: {
        Row: {
          author_id: string
          author_role: string
          body: string
          created_at: string
          id: string
          thread_id: string
        }
        Insert: {
          author_id: string
          author_role: string
          body: string
          created_at?: string
          id?: string
          thread_id: string
        }
        Update: {
          author_id?: string
          author_role?: string
          body?: string
          created_at?: string
          id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "support_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      support_threads: {
        Row: {
          business_id: string
          created_at: string
          id: string
          last_message_at: string | null
          unread_by_admin: number
          unread_by_user: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          unread_by_admin?: number
          unread_by_user?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          unread_by_admin?: number
          unread_by_user?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_threads_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: true
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          last_ping_at: string
          started_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          last_ping_at?: string
          started_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          last_ping_at?: string
          started_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      voice_agent_actions: {
        Row: {
          business_id: string
          created_at: string
          id: string
          parameters: Json
          result: Json | null
          status: string
          tool_name: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          parameters?: Json
          result?: Json | null
          status?: string
          tool_name: string
          transcript?: string | null
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          parameters?: Json
          result?: Json | null
          status?: string
          tool_name?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analytics_airtime: {
        Args: { p_business_id: string; p_from: string; p_to: string }
        Returns: {
          minutes_expected: number
          minutes_online: number
          scans: number
          scans_per_hour: number
        }[]
      }
      analytics_orphan_content: {
        Args: { p_business_id: string; p_from: string; p_to: string }
        Returns: {
          content_id: string
          created_at: string
          name: string
          thumbnail_url: string
        }[]
      }
      analytics_overview: {
        Args: { p_business_id: string; p_from: string; p_to: string }
        Returns: {
          playbacks: number
          screens_online: number
          screens_total: number
          total_play_ms: number
          uptime_pct: number
        }[]
      }
      analytics_scan_days: { Args: { p_business_id: string }; Returns: number }
      analytics_scan_heatmap: {
        Args: { p_business_id: string; p_from: string; p_to: string }
        Returns: {
          dow: number
          hour: number
          scans: number
        }[]
      }
      analytics_screen_table: {
        Args: { p_business_id: string; p_from: string; p_to: string }
        Returns: {
          last_seen_at: string
          location: string
          name: string
          playbacks: number
          screen_id: string
          status: string
          uptime_pct: number
        }[]
      }
      analytics_telemetry_days: {
        Args: { p_business_id: string }
        Returns: number
      }
      analytics_top_content: {
        Args: {
          p_business_id: string
          p_from: string
          p_limit?: number
          p_to: string
        }
        Returns: {
          content_id: string
          duration_seconds: number
          name: string
          playbacks: number
          thumbnail_url: string
          total_ms: number
        }[]
      }
      can_manage_business: { Args: { _business_id: string }; Returns: boolean }
      can_manage_content_playlists: {
        Args: { _business_id: string }
        Returns: boolean
      }
      can_manage_locations_screens: {
        Args: { _business_id: string }
        Returns: boolean
      }
      complete_onboarding: {
        Args: { p_business_name: string; p_city: string }
        Returns: Json
      }
      get_content_page: { Args: never; Returns: Json }
      get_dashboard_page: { Args: never; Returns: Json }
      get_screens_page: { Args: never; Returns: Json }
      get_tenant: { Args: never; Returns: Json }
      get_user_business_id: { Args: never; Returns: string }
      has_role_in_business: {
        Args: {
          _business_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_member_of_business: {
        Args: { _business_id: string }
        Returns: boolean
      }
      is_platform_admin: { Args: never; Returns: boolean }
      log_audit: {
        Args: {
          _action: string
          _business_id: string
          _details?: Json
          _entity_id?: string
          _entity_type?: string
        }
        Returns: string
      }
      purge_demo_analytics: {
        Args: { p_business_id: string }
        Returns: undefined
      }
      rollup_screen_uptime: { Args: { p_day?: string }; Returns: number }
      seed_demo_analytics: {
        Args: { p_business_id: string }
        Returns: undefined
      }
      sweep_offline_devices: {
        Args: { _threshold_seconds?: number }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "content_editor" | "owner" | "viewer"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "content_editor", "owner", "viewer"],
    },
  },
} as const
