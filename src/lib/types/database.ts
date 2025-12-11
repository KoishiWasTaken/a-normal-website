export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      pages: {
        Row: {
          id: string
          page_key: string
          page_url: string
          page_name: string
          page_description: string | null
          how_to_access: string | null
          can_navigate: boolean
          is_hidden: boolean
          discovery_order: number | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          page_key: string
          page_url: string
          page_name: string
          page_description?: string | null
          how_to_access?: string | null
          can_navigate?: boolean
          is_hidden?: boolean
          discovery_order?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          page_key?: string
          page_url?: string
          page_name?: string
          page_description?: string | null
          how_to_access?: string | null
          can_navigate?: boolean
          is_hidden?: boolean
          discovery_order?: number | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string | null
          username: string
          display_name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email?: string | null
          username: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          username?: string
          display_name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      page_discoveries: {
        Row: {
          id: string
          user_id: string
          page_id: string
          discovered_at: string
          discovery_number: number | null
          discovery_metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          page_id: string
          discovered_at?: string
          discovery_number?: number | null
          discovery_metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          page_id?: string
          discovered_at?: string
          discovery_number?: number | null
          discovery_metadata?: Json
        }
      }
      page_statistics: {
        Row: {
          page_id: string
          total_discoveries: number
          unique_discoverers: number
          first_discovered_at: string | null
          first_discovered_by: string | null
          last_discovered_at: string | null
          discovery_data: Json
          updated_at: string
        }
        Insert: {
          page_id: string
          total_discoveries?: number
          unique_discoverers?: number
          first_discovered_at?: string | null
          first_discovered_by?: string | null
          last_discovered_at?: string | null
          discovery_data?: Json
          updated_at?: string
        }
        Update: {
          page_id?: string
          total_discoveries?: number
          unique_discoverers?: number
          first_discovered_at?: string | null
          first_discovered_by?: string | null
          last_discovered_at?: string | null
          discovery_data?: Json
          updated_at?: string
        }
      }
      user_statistics: {
        Row: {
          user_id: string
          total_pages_discovered: number
          discovered_pages: Json
          first_discoveries: Json
          discovery_metadata: Json
          last_discovery_at: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          total_pages_discovered?: number
          discovered_pages?: Json
          first_discoveries?: Json
          discovery_metadata?: Json
          last_discovery_at?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          total_pages_discovered?: number
          discovered_pages?: Json
          first_discoveries?: Json
          discovery_metadata?: Json
          last_discovery_at?: string | null
          updated_at?: string
        }
      }
    }
    Views: {
      leaderboard: {
        Row: {
          user_id: string
          display_name: string | null
          username: string | null
          total_pages_discovered: number
          last_discovery_at: string | null
          first_discoveries_count: number
        }
      }
    }
    Functions: {
      record_page_discovery: {
        Args: {
          p_user_id: string
          p_page_key: string
        }
        Returns: Json
      }
    }
  }
}
