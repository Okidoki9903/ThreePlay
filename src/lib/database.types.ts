// Mirrors supabase/migrations. Regenerate with `npm run db:types` after schema changes.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Tells supabase-js which PostgREST version to target when inferring types.
  __InternalSupabase: { PostgrestVersion: "12.2.3" };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          display_name: string | null;
          avatar_url: string | null;
          bio: string | null;
          website: string | null;
          role: Database["public"]["Enums"]["user_role"];
          created_at: string;
        };
        Insert: {
          id: string;
          username: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          created_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          website?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          created_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          slug: string;
          name: string;
          description: string;
          icon: string;
          sort_order: number;
        };
        Insert: {
          slug: string;
          name: string;
          description?: string;
          icon?: string;
          sort_order?: number;
        };
        Update: {
          slug?: string;
          name?: string;
          description?: string;
          icon?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      games: {
        Row: {
          id: string;
          slug: string;
          title: string;
          short_description: string;
          long_description: string;
          category_slug: string;
          tags: string[];
          cover_url: string;
          screenshots: string[];
          game_url: string;
          is_hosted: boolean;
          controls: string;
          developer_name: string;
          developer_url: string | null;
          source_url: string | null;
          submitted_by: string | null;
          status: Database["public"]["Enums"]["game_status"];
          rejection_reason: string | null;
          is_featured: boolean;
          featured_at: string | null;
          threejs_detected: boolean | null;
          threejs_revision: string | null;
          play_count: number;
          rating_avg: number;
          rating_count: number;
          released_at: string;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
          search: unknown;
        };
        Insert: {
          id?: string;
          slug: string;
          title: string;
          short_description: string;
          long_description?: string;
          category_slug: string;
          tags?: string[];
          cover_url: string;
          screenshots?: string[];
          game_url: string;
          is_hosted?: boolean;
          controls?: string;
          developer_name: string;
          developer_url?: string | null;
          source_url?: string | null;
          submitted_by?: string | null;
          status?: Database["public"]["Enums"]["game_status"];
          rejection_reason?: string | null;
          is_featured?: boolean;
          featured_at?: string | null;
          threejs_detected?: boolean | null;
          threejs_revision?: string | null;
          play_count?: number;
          rating_avg?: number;
          rating_count?: number;
          released_at?: string;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          title?: string;
          short_description?: string;
          long_description?: string;
          category_slug?: string;
          tags?: string[];
          cover_url?: string;
          screenshots?: string[];
          game_url?: string;
          is_hosted?: boolean;
          controls?: string;
          developer_name?: string;
          developer_url?: string | null;
          source_url?: string | null;
          submitted_by?: string | null;
          status?: Database["public"]["Enums"]["game_status"];
          rejection_reason?: string | null;
          is_featured?: boolean;
          featured_at?: string | null;
          threejs_detected?: boolean | null;
          threejs_revision?: string | null;
          play_count?: number;
          rating_avg?: number;
          rating_count?: number;
          released_at?: string;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "games_category_slug_fkey";
            columns: ["category_slug"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["slug"];
          },
          {
            foreignKeyName: "games_submitted_by_fkey";
            columns: ["submitted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          game_id: string;
          user_id: string;
          rating: number;
          body: string;
          is_hidden: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          game_id: string;
          user_id: string;
          rating: number;
          body?: string;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          game_id?: string;
          user_id?: string;
          rating?: number;
          body?: string;
          is_hidden?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      favorites: {
        Row: { user_id: string; game_id: string; created_at: string };
        Insert: { user_id: string; game_id: string; created_at?: string };
        Update: { user_id?: string; game_id?: string; created_at?: string };
        Relationships: [
          {
            foreignKeyName: "favorites_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "favorites_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      plays: {
        Row: { id: number; game_id: string; user_id: string | null; created_at: string };
        Insert: { id?: never; game_id: string; user_id?: string | null; created_at?: string };
        Update: { id?: never; game_id?: string; user_id?: string | null; created_at?: string };
        Relationships: [
          {
            foreignKeyName: "plays_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plays_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          id: string;
          game_id: string;
          review_id: string | null;
          reporter_id: string | null;
          reason: Database["public"]["Enums"]["report_reason"];
          details: string;
          status: Database["public"]["Enums"]["report_status"];
          created_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          game_id: string;
          review_id?: string | null;
          reporter_id?: string | null;
          reason: Database["public"]["Enums"]["report_reason"];
          details?: string;
          status?: Database["public"]["Enums"]["report_status"];
          created_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          game_id?: string;
          review_id?: string | null;
          reporter_id?: string | null;
          reason?: Database["public"]["Enums"]["report_reason"];
          details?: string;
          status?: Database["public"]["Enums"]["report_status"];
          created_at?: string;
          resolved_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "reports_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "reviews";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_reporter_id_fkey";
            columns: ["reporter_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
      record_play: { Args: { p_game_id: string }; Returns: undefined };
      trending_games: {
        Args: { p_days?: number; p_limit?: number };
        Returns: { game_id: string; plays: number }[];
      };
      top_rated_recent: {
        Args: { p_days?: number; p_limit?: number; p_min_ratings?: number };
        Returns: { game_id: string; avg_rating: number; ratings: number }[];
      };
      random_game_slug: { Args: { p_exclude?: string }; Returns: string };
      popular_tags: { Args: { p_limit?: number }; Returns: { tag: string; uses: number }[] };
    };
    Enums: {
      user_role: "user" | "admin";
      game_status: "pending" | "approved" | "rejected";
      report_status: "open" | "resolved" | "dismissed";
      report_reason: "broken" | "not_threejs" | "inappropriate" | "malware" | "copyright" | "spam" | "other";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];
export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
