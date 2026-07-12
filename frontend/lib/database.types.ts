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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      competitions: {
        Row: {
          competition_gender: string | null
          competition_id: number
          competition_name: string
          country_name: string | null
          created_at: string
          season_id: number
          season_name: string
          updated_at: string
        }
        Insert: {
          competition_gender?: string | null
          competition_id: number
          competition_name: string
          country_name?: string | null
          created_at?: string
          season_id: number
          season_name: string
          updated_at?: string
        }
        Update: {
          competition_gender?: string | null
          competition_id?: number
          competition_name?: string
          country_name?: string | null
          created_at?: string
          season_id?: number
          season_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      match_analytics: {
        Row: {
          ai_evaluation: Json
          created_at: string
          generated_at: string
          match_id: number
          model: string | null
          team_stats: Json
          updated_at: string
        }
        Insert: {
          ai_evaluation: Json
          created_at?: string
          generated_at?: string
          match_id: number
          model?: string | null
          team_stats: Json
          updated_at?: string
        }
        Update: {
          ai_evaluation?: Json
          created_at?: string
          generated_at?: string
          match_id?: number
          model?: string | null
          team_stats?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_analytics_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
        ]
      }
      match_passing_networks: {
        Row: {
          created_at: string
          data: Json
          generated_at: string
          match_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: Json
          generated_at?: string
          match_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          generated_at?: string
          match_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_passing_networks_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
        ]
      }
      match_shots: {
        Row: {
          created_at: string
          data: Json
          generated_at: string
          match_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: Json
          generated_at?: string
          match_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          generated_at?: string
          match_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_shots_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
        ]
      }
      match_team_stats: {
        Row: {
          created_at: string
          duels_won: number | null
          home_or_away: string
          id: number
          match_id: number
          passes: number | null
          possession_pct: number | null
          pressure_regain_pct: number | null
          pressures: number | null
          team_id: number
          total_shots: number | null
          total_xg: number | null
          touches: number | null
          updated_at: string
          zone_attacking_third: number | null
          zone_defensive_third: number | null
          zone_middle_third: number | null
        }
        Insert: {
          created_at?: string
          duels_won?: number | null
          home_or_away: string
          id?: never
          match_id: number
          passes?: number | null
          possession_pct?: number | null
          pressure_regain_pct?: number | null
          pressures?: number | null
          team_id: number
          total_shots?: number | null
          total_xg?: number | null
          touches?: number | null
          updated_at?: string
          zone_attacking_third?: number | null
          zone_defensive_third?: number | null
          zone_middle_third?: number | null
        }
        Update: {
          created_at?: string
          duels_won?: number | null
          home_or_away?: string
          id?: never
          match_id?: number
          passes?: number | null
          possession_pct?: number | null
          pressure_regain_pct?: number | null
          pressures?: number | null
          team_id?: number
          total_shots?: number | null
          total_xg?: number | null
          touches?: number | null
          updated_at?: string
          zone_attacking_third?: number | null
          zone_defensive_third?: number | null
          zone_middle_third?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "match_team_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "match_team_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      match_timeline: {
        Row: {
          created_at: string
          data: Json
          generated_at: string
          match_id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          data: Json
          generated_at?: string
          match_id: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          data?: Json
          generated_at?: string
          match_id?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_timeline_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: true
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
        ]
      }
      matches: {
        Row: {
          away_score: number
          away_team_id: number
          competition_id: number | null
          competition_stage: string | null
          created_at: string
          home_score: number
          home_team_id: number
          kick_off: string | null
          match_date: string | null
          match_id: number
          season_id: number | null
          updated_at: string
        }
        Insert: {
          away_score?: number
          away_team_id: number
          competition_id?: number | null
          competition_stage?: string | null
          created_at?: string
          home_score?: number
          home_team_id: number
          kick_off?: string | null
          match_date?: string | null
          match_id: number
          season_id?: number | null
          updated_at?: string
        }
        Update: {
          away_score?: number
          away_team_id?: number
          competition_id?: number | null
          competition_stage?: string | null
          created_at?: string
          home_score?: number
          home_team_id?: number
          kick_off?: string | null
          match_date?: string | null
          match_id?: number
          season_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "matches_away_team_id_fkey"
            columns: ["away_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
          {
            foreignKeyName: "matches_competition_id_season_id_fkey"
            columns: ["competition_id", "season_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["competition_id", "season_id"]
          },
          {
            foreignKeyName: "matches_home_team_id_fkey"
            columns: ["home_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      player_match_stats: {
        Row: {
          assists: number
          average_position: Json | null
          created_at: string
          dribbles: number
          goals: number
          home_or_away: string
          id: number
          is_starter: boolean
          match_id: number
          minutes_played: number
          name: string
          pass_accuracy: number
          passes: number
          player_id: number
          position: string | null
          shirt_number: number | null
          tackles: number
          team_id: number | null
          team_name: string
          touch_locations: Json
          touches: number
          updated_at: string
          xa: number
          xg: number
        }
        Insert: {
          assists?: number
          average_position?: Json | null
          created_at?: string
          dribbles?: number
          goals?: number
          home_or_away: string
          id?: never
          is_starter?: boolean
          match_id: number
          minutes_played?: number
          name: string
          pass_accuracy?: number
          passes?: number
          player_id: number
          position?: string | null
          shirt_number?: number | null
          tackles?: number
          team_id?: number | null
          team_name: string
          touch_locations?: Json
          touches?: number
          updated_at?: string
          xa?: number
          xg?: number
        }
        Update: {
          assists?: number
          average_position?: Json | null
          created_at?: string
          dribbles?: number
          goals?: number
          home_or_away?: string
          id?: never
          is_starter?: boolean
          match_id?: number
          minutes_played?: number
          name?: string
          pass_accuracy?: number
          passes?: number
          player_id?: number
          position?: string | null
          shirt_number?: number | null
          tackles?: number
          team_id?: number | null
          team_name?: string
          touch_locations?: Json
          touches?: number
          updated_at?: string
          xa?: number
          xg?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_match_stats_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["match_id"]
          },
          {
            foreignKeyName: "player_match_stats_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["team_id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          crest_url: string | null
          team_id: number
          team_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          crest_url?: string | null
          team_id: number
          team_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          crest_url?: string | null
          team_id?: number
          team_name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
