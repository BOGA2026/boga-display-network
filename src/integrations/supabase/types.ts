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
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
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
          file_url: string | null
          id: string
          name: string
          thumbnail_url: string | null
          type: string
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          file_url?: string | null
          id?: string
          name: string
          thumbnail_url?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          file_url?: string | null
          id?: string
          name?: string
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
      devices: {
        Row: {
          app_version: string | null
          business_id: string
          created_at: string
          device_code: string
          heartbeat_token: string | null
          id: string
          last_seen_at: string | null
          location_id: string | null
          paired_at: string | null
          screen_id: string | null
          screen_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          app_version?: string | null
          business_id: string
          created_at?: string
          device_code: string
          heartbeat_token?: string | null
          id?: string
          last_seen_at?: string | null
          location_id?: string | null
          paired_at?: string | null
          screen_id?: string | null
          screen_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          app_version?: string | null
          business_id?: string
          created_at?: string
          device_code?: string
          heartbeat_token?: string | null
          id?: string
          last_seen_at?: string | null
          location_id?: string | null
          paired_at?: string | null
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
          company: string | null
          created_at: string | null
          email: string | null
          goal: string | null
          id: string
          inquiry: string | null
          name: string | null
          phone: string | null
          preferred_contact: string | null
          preferred_time: string | null
          screens: number
          source: string
          status: string
          whatsapp: string | null
        }
        Insert: {
          budget?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          goal?: string | null
          id?: string
          inquiry?: string | null
          name?: string | null
          phone?: string | null
          preferred_contact?: string | null
          preferred_time?: string | null
          screens?: number
          source?: string
          status?: string
          whatsapp?: string | null
        }
        Update: {
          budget?: string | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          goal?: string | null
          id?: string
          inquiry?: string | null
          name?: string | null
          phone?: string | null
          preferred_contact?: string | null
          preferred_time?: string | null
          screens?: number
          source?: string
          status?: string
          whatsapp?: string | null
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
      payment_methods: {
        Row: {
          brand: string
          business_id: string
          created_at: string
          exp_month: number
          exp_year: number
          id: string
          is_default: boolean
          last4: string
          provider: string
          provider_ref: string | null
          updated_at: string
        }
        Insert: {
          brand?: string
          business_id: string
          created_at?: string
          exp_month?: number
          exp_year?: number
          id?: string
          is_default?: boolean
          last4?: string
          provider?: string
          provider_ref?: string | null
          updated_at?: string
        }
        Update: {
          brand?: string
          business_id?: string
          created_at?: string
          exp_month?: number
          exp_year?: number
          id?: string
          is_default?: boolean
          last4?: string
          provider?: string
          provider_ref?: string | null
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
          created_at: string
          id: string
          invoice_number: string
          payment_method: string | null
          status: string
          subscription_id: string
          tax_id: string | null
        }
        Insert: {
          amount: number
          billing_email?: string | null
          billing_name?: string | null
          business_id: string
          created_at?: string
          id?: string
          invoice_number: string
          payment_method?: string | null
          status?: string
          subscription_id: string
          tax_id?: string | null
        }
        Update: {
          amount?: number
          billing_email?: string | null
          billing_name?: string | null
          business_id?: string
          created_at?: string
          id?: string
          invoice_number?: string
          payment_method?: string | null
          status?: string
          subscription_id?: string
          tax_id?: string | null
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
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      playlist_items: {
        Row: {
          content_id: string
          created_at: string
          id: string
          playlist_id: string
          sort_order: number
        }
        Insert: {
          content_id: string
          created_at?: string
          id?: string
          playlist_id: string
          sort_order?: number
        }
        Update: {
          content_id?: string
          created_at?: string
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
      screens: {
        Row: {
          activated_at: string | null
          app_version: string | null
          created_at: string
          device_model: string | null
          device_token: string | null
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
        ]
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
      can_manage_business: { Args: { _business_id: string }; Returns: boolean }
      can_manage_content_playlists: {
        Args: { _business_id: string }
        Returns: boolean
      }
      can_manage_locations_screens: {
        Args: { _business_id: string }
        Returns: boolean
      }
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
    }
    Enums: {
      app_role: "admin" | "manager" | "content_editor"
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
      app_role: ["admin", "manager", "content_editor"],
    },
  },
} as const
