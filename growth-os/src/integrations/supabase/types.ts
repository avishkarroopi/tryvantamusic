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
      activities: {
        Row: {
          actor_id: string | null
          created_at: string
          id: string
          kind: string
          lead_id: string | null
          payload: Json
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind: string
          lead_id?: string | null
          payload?: Json
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          id?: string
          kind?: string
          lead_id?: string | null
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_entities: {
        Row: {
          budget: number | null
          created_at: string
          currency: string | null
          external_id: string | null
          id: string
          level: Database["public"]["Enums"]["ad_entity_level"]
          metadata: Json
          metrics: Json
          name: string
          parent_external_id: string | null
          period_end: string | null
          period_start: string | null
          platform: Database["public"]["Enums"]["ad_platform"]
          status: string | null
          updated_at: string
        }
        Insert: {
          budget?: number | null
          created_at?: string
          currency?: string | null
          external_id?: string | null
          id?: string
          level: Database["public"]["Enums"]["ad_entity_level"]
          metadata?: Json
          metrics?: Json
          name: string
          parent_external_id?: string | null
          period_end?: string | null
          period_start?: string | null
          platform: Database["public"]["Enums"]["ad_platform"]
          status?: string | null
          updated_at?: string
        }
        Update: {
          budget?: number | null
          created_at?: string
          currency?: string | null
          external_id?: string | null
          id?: string
          level?: Database["public"]["Enums"]["ad_entity_level"]
          metadata?: Json
          metrics?: Json
          name?: string
          parent_external_id?: string | null
          period_end?: string | null
          period_start?: string | null
          platform?: Database["public"]["Enums"]["ad_platform"]
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      ad_recommendations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          dismissed_at: string | null
          entity_name: string | null
          entity_ref: string | null
          id: string
          kind: string
          metrics_snapshot: Json
          platform: Database["public"]["Enums"]["ad_platform"]
          priority: Database["public"]["Enums"]["ad_reco_priority"]
          rationale: string | null
          status: Database["public"]["Enums"]["ad_reco_status"]
          title: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          dismissed_at?: string | null
          entity_name?: string | null
          entity_ref?: string | null
          id?: string
          kind: string
          metrics_snapshot?: Json
          platform: Database["public"]["Enums"]["ad_platform"]
          priority?: Database["public"]["Enums"]["ad_reco_priority"]
          rationale?: string | null
          status?: Database["public"]["Enums"]["ad_reco_status"]
          title: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          dismissed_at?: string | null
          entity_name?: string | null
          entity_ref?: string | null
          id?: string
          kind?: string
          metrics_snapshot?: Json
          platform?: Database["public"]["Enums"]["ad_platform"]
          priority?: Database["public"]["Enums"]["ad_reco_priority"]
          rationale?: string | null
          status?: Database["public"]["Enums"]["ad_reco_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      agents_briefs: {
        Row: {
          bottlenecks: Json
          created_at: string
          id: string
          priorities: Json
          recommended_actions: Json
          summary: string
          workforce_health: number
        }
        Insert: {
          bottlenecks?: Json
          created_at?: string
          id?: string
          priorities?: Json
          recommended_actions?: Json
          summary: string
          workforce_health?: number
        }
        Update: {
          bottlenecks?: Json
          created_at?: string
          id?: string
          priorities?: Json
          recommended_actions?: Json
          summary?: string
          workforce_health?: number
        }
        Relationships: []
      }
      agents_events: {
        Row: {
          causation_event_id: string | null
          created_at: string
          event_type: string
          fan_out_depth: number
          from_agent: string
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          run_id: string | null
          to_agent: string | null
        }
        Insert: {
          causation_event_id?: string | null
          created_at?: string
          event_type: string
          fan_out_depth?: number
          from_agent: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          run_id?: string | null
          to_agent?: string | null
        }
        Update: {
          causation_event_id?: string | null
          created_at?: string
          event_type?: string
          fan_out_depth?: number
          from_agent?: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          run_id?: string | null
          to_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_events_causation_event_id_fkey"
            columns: ["causation_event_id"]
            isOneToOne: false
            referencedRelation: "agents_events"
            referencedColumns: ["id"]
          },
        ]
      }
      agents_subscriptions: {
        Row: {
          active: boolean
          agent_slug: string
          category: string
          created_at: string
          event_type: string
          id: string
        }
        Insert: {
          active?: boolean
          agent_slug: string
          category?: string
          created_at?: string
          event_type: string
          id?: string
        }
        Update: {
          active?: boolean
          agent_slug?: string
          category?: string
          created_at?: string
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_subscriptions_agent_slug_fkey"
            columns: ["agent_slug"]
            isOneToOne: false
            referencedRelation: "agents_registry"
            referencedColumns: ["slug"]
          },
        ]
      }
      approval_requests: {
        Row: {
          action_payload: Json
          action_type: string
          after_state: Json | null
          agent_slug: string
          before_state: Json | null
          decided_at: string | null
          decided_by: string | null
          executed_at: string | null
          execution_result: Json | null
          expires_at: string
          id: string
          reasoning: string | null
          requested_at: string
          risk_level: string
          run_id: string | null
          status: string
        }
        Insert: {
          action_payload?: Json
          action_type: string
          after_state?: Json | null
          agent_slug: string
          before_state?: Json | null
          decided_at?: string | null
          decided_by?: string | null
          executed_at?: string | null
          execution_result?: Json | null
          expires_at?: string
          id?: string
          reasoning?: string | null
          requested_at?: string
          risk_level: string
          run_id?: string | null
          status?: string
        }
        Update: {
          action_payload?: Json
          action_type?: string
          after_state?: Json | null
          agent_slug?: string
          before_state?: Json | null
          decided_at?: string | null
          decided_by?: string | null
          executed_at?: string | null
          execution_result?: Json | null
          expires_at?: string
          id?: string
          reasoning?: string | null
          requested_at?: string
          risk_level?: string
          run_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_agent_slug_fkey"
            columns: ["agent_slug"]
            isOneToOne: false
            referencedRelation: "agents_registry"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "approval_requests_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agents_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      agents_knowledge: {
        Row: {
          category: string
          content: string
          created_at: string
          created_by: string | null
          id: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      agents_logs: {
        Row: {
          agent_slug: string
          created_at: string
          data: Json | null
          id: string
          level: string
          message: string
          run_id: string | null
        }
        Insert: {
          agent_slug: string
          created_at?: string
          data?: Json | null
          id?: string
          level?: string
          message: string
          run_id?: string | null
        }
        Update: {
          agent_slug?: string
          created_at?: string
          data?: Json | null
          id?: string
          level?: string
          message?: string
          run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agents_logs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "agents_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      agents_memory: {
        Row: {
          agent_slug: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          agent_slug: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          agent_slug?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "agents_memory_agent_slug_fkey"
            columns: ["agent_slug"]
            isOneToOne: false
            referencedRelation: "agents_registry"
            referencedColumns: ["slug"]
          },
        ]
      }
      agents_metrics: {
        Row: {
          agent_slug: string
          avg_duration_ms: number
          date: string
          failures: number
          health_score: number
          runs: number
          successes: number
          updated_at: string
        }
        Insert: {
          agent_slug: string
          avg_duration_ms?: number
          date?: string
          failures?: number
          health_score?: number
          runs?: number
          successes?: number
          updated_at?: string
        }
        Update: {
          agent_slug?: string
          avg_duration_ms?: number
          date?: string
          failures?: number
          health_score?: number
          runs?: number
          successes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_metrics_agent_slug_fkey"
            columns: ["agent_slug"]
            isOneToOne: false
            referencedRelation: "agents_registry"
            referencedColumns: ["slug"]
          },
        ]
      }
      agents_registry: {
        Row: {
          category: string
          config: Json
          created_at: string
          default_schedule: string | null
          description: string
          enabled: boolean
          goal: string | null
          health_score: number
          icon: string
          integrations: Json
          kpis: Json
          last_run_at: string | null
          max_retries: number
          mission: string | null
          mode: string
          name: string
          next_run_at: string | null
          prompt: string | null
          skills: Json
          slug: string
          tools: Json
          updated_at: string
          version: number
        }
        Insert: {
          category: string
          config?: Json
          created_at?: string
          default_schedule?: string | null
          description?: string
          enabled?: boolean
          goal?: string | null
          health_score?: number
          icon?: string
          integrations?: Json
          kpis?: Json
          last_run_at?: string | null
          max_retries?: number
          mission?: string | null
          mode?: string
          name: string
          next_run_at?: string | null
          prompt?: string | null
          skills?: Json
          slug: string
          tools?: Json
          updated_at?: string
          version?: number
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string
          default_schedule?: string | null
          description?: string
          enabled?: boolean
          goal?: string | null
          health_score?: number
          icon?: string
          integrations?: Json
          kpis?: Json
          last_run_at?: string | null
          max_retries?: number
          mission?: string | null
          mode?: string
          name?: string
          next_run_at?: string | null
          prompt?: string | null
          skills?: Json
          slug?: string
          tools?: Json
          updated_at?: string
          version?: number
        }
        Relationships: []
      }
      agents_runs: {
        Row: {
          agent_slug: string
          attempt: number
          causation_event_id: string | null
          created_at: string
          duration_ms: number | null
          error: string | null
          finished_at: string | null
          heartbeat_at: string | null
          id: string
          input: Json
          max_retries: number
          next_retry_at: string | null
          output: Json | null
          retry_count: number
          started_at: string
          status: string
          trigger: string
        }
        Insert: {
          agent_slug: string
          attempt?: number
          causation_event_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          heartbeat_at?: string | null
          id?: string
          input?: Json
          max_retries?: number
          next_retry_at?: string | null
          output?: Json | null
          retry_count?: number
          started_at?: string
          status?: string
          trigger?: string
        }
        Update: {
          agent_slug?: string
          attempt?: number
          causation_event_id?: string | null
          created_at?: string
          duration_ms?: number | null
          error?: string | null
          finished_at?: string | null
          heartbeat_at?: string | null
          id?: string
          input?: Json
          max_retries?: number
          next_retry_at?: string | null
          output?: Json | null
          retry_count?: number
          started_at?: string
          status?: string
          trigger?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_runs_agent_slug_fkey"
            columns: ["agent_slug"]
            isOneToOne: false
            referencedRelation: "agents_registry"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "agents_runs_causation_event_fkey"
            columns: ["causation_event_id"]
            isOneToOne: false
            referencedRelation: "agents_events"
            referencedColumns: ["id"]
          },
        ]
      }
      agents_tasks: {
        Row: {
          agent_slug: string
          completed_at: string | null
          created_at: string
          id: string
          kind: string
          payload: Json
          priority: string
          scheduled_for: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          agent_slug: string
          completed_at?: string | null
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          priority?: string
          scheduled_for?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          agent_slug?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          priority?: string
          scheduled_for?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_tasks_agent_slug_fkey"
            columns: ["agent_slug"]
            isOneToOne: false
            referencedRelation: "agents_registry"
            referencedColumns: ["slug"]
          },
        ]
      }
      ai_runs: {
        Row: {
          actor_id: string | null
          created_at: string
          error: string | null
          id: string
          input_tokens: number | null
          latency_ms: number | null
          lead_id: string | null
          metadata: Json
          model: string
          output_tokens: number | null
          prompt_summary: string | null
          purpose: string
          success: boolean
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          lead_id?: string | null
          metadata?: Json
          model: string
          output_tokens?: number | null
          prompt_summary?: string | null
          purpose: string
          success?: boolean
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          input_tokens?: number | null
          latency_ms?: number | null
          lead_id?: string | null
          metadata?: Json
          model?: string
          output_tokens?: number | null
          prompt_summary?: string | null
          purpose?: string
          success?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "ai_runs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      content_items: {
        Row: {
          ai_generated: boolean
          ai_prompt: string | null
          approved_by: string | null
          body: string | null
          category: string | null
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["content_kind"]
          metadata: Json
          platform: string | null
          published_at: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["content_status"]
          tags: Json
          title: string
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean
          ai_prompt?: string | null
          approved_by?: string | null
          body?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["content_kind"]
          metadata?: Json
          platform?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: Json
          title: string
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean
          ai_prompt?: string | null
          approved_by?: string | null
          body?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["content_kind"]
          metadata?: Json
          platform?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["content_status"]
          tags?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      copilot_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          metadata: Json
          role: Database["public"]["Enums"]["copilot_role"]
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          metadata?: Json
          role: Database["public"]["Enums"]["copilot_role"]
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          metadata?: Json
          role?: Database["public"]["Enums"]["copilot_role"]
          user_id?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          amount: number
          campaign: string | null
          country: string | null
          created_at: string
          currency: string
          enrolled_at: string
          id: string
          instrument: string | null
          lead_id: string | null
          metadata: Json
          program: string | null
          source: Database["public"]["Enums"]["lead_source"] | null
          updated_at: string
        }
        Insert: {
          amount: number
          campaign?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          enrolled_at?: string
          id?: string
          instrument?: string | null
          lead_id?: string | null
          metadata?: Json
          program?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          updated_at?: string
        }
        Update: {
          amount?: number
          campaign?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          enrolled_at?: string
          id?: string
          instrument?: string | null
          lead_id?: string | null
          metadata?: Json
          program?: string | null
          source?: Database["public"]["Enums"]["lead_source"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      founder_briefs: {
        Row: {
          created_at: string
          generated_at: string
          highlights: Json
          id: string
          metrics: Json
          period: Database["public"]["Enums"]["brief_period"]
          period_end: string
          period_start: string
          summary: string
        }
        Insert: {
          created_at?: string
          generated_at?: string
          highlights?: Json
          id?: string
          metrics?: Json
          period: Database["public"]["Enums"]["brief_period"]
          period_end: string
          period_start: string
          summary: string
        }
        Update: {
          created_at?: string
          generated_at?: string
          highlights?: Json
          id?: string
          metrics?: Json
          period?: Database["public"]["Enums"]["brief_period"]
          period_end?: string
          period_start?: string
          summary?: string
        }
        Relationships: []
      }
      gbp_actions: {
        Row: {
          category: string | null
          completed_at: string | null
          created_at: string
          description: string | null
          expected_impact: string | null
          id: string
          priority: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          expected_impact?: string | null
          id?: string
          priority?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          expected_impact?: string | null
          id?: string
          priority?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gbp_competitors: {
        Row: {
          avg_rating: number | null
          categories: string[] | null
          created_at: string
          id: string
          name: string
          photo_count: number | null
          post_count: number | null
          review_count: number | null
          services: Json | null
          strengths: string[] | null
          updated_at: string
          url: string | null
          user_id: string
          visibility_score: number | null
          weaknesses: string[] | null
        }
        Insert: {
          avg_rating?: number | null
          categories?: string[] | null
          created_at?: string
          id?: string
          name: string
          photo_count?: number | null
          post_count?: number | null
          review_count?: number | null
          services?: Json | null
          strengths?: string[] | null
          updated_at?: string
          url?: string | null
          user_id: string
          visibility_score?: number | null
          weaknesses?: string[] | null
        }
        Update: {
          avg_rating?: number | null
          categories?: string[] | null
          created_at?: string
          id?: string
          name?: string
          photo_count?: number | null
          post_count?: number | null
          review_count?: number | null
          services?: Json | null
          strengths?: string[] | null
          updated_at?: string
          url?: string | null
          user_id?: string
          visibility_score?: number | null
          weaknesses?: string[] | null
        }
        Relationships: []
      }
      gbp_posts: {
        Row: {
          body: string | null
          created_at: string
          id: string
          image_url: string | null
          post_type: string
          published_at: string | null
          scheduled_at: string | null
          status: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          post_type?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          post_type?: string
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      gbp_profile: {
        Row: {
          additional_categories: string[] | null
          address: string | null
          appointment_link: string | null
          avg_rating: number | null
          business_name: string | null
          city: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          health_score: number | null
          id: string
          keywords: string[] | null
          last_synced_at: string | null
          logo_url: string | null
          opening_hours: Json | null
          phone: string | null
          photo_count: number | null
          post_count: number | null
          primary_category: string | null
          products: Json | null
          qna_count: number | null
          services: Json | null
          total_reviews: number | null
          updated_at: string
          user_id: string
          video_count: number | null
          visibility_score: number | null
          website: string | null
        }
        Insert: {
          additional_categories?: string[] | null
          address?: string | null
          appointment_link?: string | null
          avg_rating?: number | null
          business_name?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          health_score?: number | null
          id?: string
          keywords?: string[] | null
          last_synced_at?: string | null
          logo_url?: string | null
          opening_hours?: Json | null
          phone?: string | null
          photo_count?: number | null
          post_count?: number | null
          primary_category?: string | null
          products?: Json | null
          qna_count?: number | null
          services?: Json | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
          video_count?: number | null
          visibility_score?: number | null
          website?: string | null
        }
        Update: {
          additional_categories?: string[] | null
          address?: string | null
          appointment_link?: string | null
          avg_rating?: number | null
          business_name?: string | null
          city?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          health_score?: number | null
          id?: string
          keywords?: string[] | null
          last_synced_at?: string | null
          logo_url?: string | null
          opening_hours?: Json | null
          phone?: string | null
          photo_count?: number | null
          post_count?: number | null
          primary_category?: string | null
          products?: Json | null
          qna_count?: number | null
          services?: Json | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
          video_count?: number | null
          visibility_score?: number | null
          website?: string | null
        }
        Relationships: []
      }
      gbp_reputation_snapshots: {
        Row: {
          avg_rating: number | null
          created_at: string
          health_score: number | null
          id: string
          photo_count: number | null
          post_count: number | null
          snapshot_date: string
          total_reviews: number | null
          user_id: string
          visibility_score: number | null
        }
        Insert: {
          avg_rating?: number | null
          created_at?: string
          health_score?: number | null
          id?: string
          photo_count?: number | null
          post_count?: number | null
          snapshot_date?: string
          total_reviews?: number | null
          user_id: string
          visibility_score?: number | null
        }
        Update: {
          avg_rating?: number | null
          created_at?: string
          health_score?: number | null
          id?: string
          photo_count?: number | null
          post_count?: number | null
          snapshot_date?: string
          total_reviews?: number | null
          user_id?: string
          visibility_score?: number | null
        }
        Relationships: []
      }
      gbp_reviews: {
        Row: {
          content: string | null
          created_at: string
          external_id: string | null
          id: string
          keywords: string[] | null
          rating: number
          replied: boolean
          reply_text: string | null
          reviewed_at: string | null
          reviewer_name: string | null
          sentiment: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          keywords?: string[] | null
          rating: number
          replied?: boolean
          reply_text?: string | null
          reviewed_at?: string | null
          reviewer_name?: string | null
          sentiment?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          external_id?: string | null
          id?: string
          keywords?: string[] | null
          rating?: number
          replied?: boolean
          reply_text?: string | null
          reviewed_at?: string | null
          reviewer_name?: string | null
          sentiment?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_discovered_resources: {
        Row: {
          discovered_at: string
          display_name: string | null
          id: string
          metadata: Json
          resource_id: string
          resource_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          discovered_at?: string
          display_name?: string | null
          id?: string
          metadata?: Json
          resource_id: string
          resource_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          discovered_at?: string
          display_name?: string | null
          id?: string
          metadata?: Json
          resource_id?: string
          resource_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_integrations: {
        Row: {
          connected_at: string
          google_email: string
          refresh_token_ciphertext: string
          refresh_token_iv: string
          refresh_token_tag: string
          scopes: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_at?: string
          google_email: string
          refresh_token_ciphertext: string
          refresh_token_iv: string
          refresh_token_tag: string
          scopes?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_at?: string
          google_email?: string
          refresh_token_ciphertext?: string
          refresh_token_iv?: string
          refresh_token_tag?: string
          scopes?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      insights: {
        Row: {
          agent: string
          body: string | null
          created_at: string
          dismissed_at: string | null
          id: string
          kind: string
          metadata: Json
          priority: Database["public"]["Enums"]["insight_priority"]
          title: string
        }
        Insert: {
          agent: string
          body?: string | null
          created_at?: string
          dismissed_at?: string | null
          id?: string
          kind: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["insight_priority"]
          title: string
        }
        Update: {
          agent?: string
          body?: string | null
          created_at?: string
          dismissed_at?: string | null
          id?: string
          kind?: string
          metadata?: Json
          priority?: Database["public"]["Enums"]["insight_priority"]
          title?: string
        }
        Relationships: []
      }
      lead_label_assignments: {
        Row: {
          created_at: string
          id: string
          label: Database["public"]["Enums"]["lead_label"]
          lead_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: Database["public"]["Enums"]["lead_label"]
          lead_id: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: Database["public"]["Enums"]["lead_label"]
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_label_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_score_breakdown: {
        Row: {
          ai_next_action: string | null
          ai_summary: string | null
          budget: number
          demographic: number
          engagement: number
          geographic: number
          id: string
          intent: number
          lead_id: string
          program_fit: number
          total: number
          updated_at: string
          urgency: number
        }
        Insert: {
          ai_next_action?: string | null
          ai_summary?: string | null
          budget?: number
          demographic?: number
          engagement?: number
          geographic?: number
          id?: string
          intent?: number
          lead_id: string
          program_fit?: number
          total?: number
          updated_at?: string
          urgency?: number
        }
        Update: {
          ai_next_action?: string | null
          ai_summary?: string | null
          budget?: number
          demographic?: number
          engagement?: number
          geographic?: number
          id?: string
          intent?: number
          lead_id?: string
          program_fit?: number
          total?: number
          updated_at?: string
          urgency?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_score_breakdown_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: true
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          age: number | null
          assigned_to: string | null
          campaign_source: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          instrument: string | null
          last_activity_at: string
          learning_goal: Database["public"]["Enums"]["learning_goal"] | null
          name: string | null
          notes: string | null
          parent_name: string | null
          phone: string | null
          score: number
          skill_level: Database["public"]["Enums"]["skill_level"] | null
          source: Database["public"]["Enums"]["lead_source"]
          source_metadata: Json
          status: Database["public"]["Enums"]["lead_status"]
          student_name: string | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          age?: number | null
          assigned_to?: string | null
          campaign_source?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instrument?: string | null
          last_activity_at?: string
          learning_goal?: Database["public"]["Enums"]["learning_goal"] | null
          name?: string | null
          notes?: string | null
          parent_name?: string | null
          phone?: string | null
          score?: number
          skill_level?: Database["public"]["Enums"]["skill_level"] | null
          source?: Database["public"]["Enums"]["lead_source"]
          source_metadata?: Json
          status?: Database["public"]["Enums"]["lead_status"]
          student_name?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          age?: number | null
          assigned_to?: string | null
          campaign_source?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          instrument?: string | null
          last_activity_at?: string
          learning_goal?: Database["public"]["Enums"]["learning_goal"] | null
          name?: string | null
          notes?: string | null
          parent_name?: string | null
          phone?: string | null
          score?: number
          skill_level?: Database["public"]["Enums"]["skill_level"] | null
          source?: Database["public"]["Enums"]["lead_source"]
          source_metadata?: Json
          status?: Database["public"]["Enums"]["lead_status"]
          student_name?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      marketing_costs: {
        Row: {
          campaign: string | null
          cost: number
          created_at: string
          currency: string
          id: string
          notes: string | null
          period_end: string
          period_start: string
          source: Database["public"]["Enums"]["lead_source"] | null
          updated_at: string
        }
        Insert: {
          campaign?: string | null
          cost: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          period_end: string
          period_start: string
          source?: Database["public"]["Enums"]["lead_source"] | null
          updated_at?: string
        }
        Update: {
          campaign?: string | null
          cost?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          period_end?: string
          period_start?: string
          source?: Database["public"]["Enums"]["lead_source"] | null
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          lead_id: string | null
          payload: Json
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          payload?: Json
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          payload?: Json
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      qualification_responses: {
        Row: {
          budget: Database["public"]["Enums"]["budget_level"] | null
          country: string | null
          created_at: string
          goal: Database["public"]["Enums"]["learning_goal"] | null
          id: string
          instrument: string | null
          lead_id: string
          learning_format: string | null
          preferred_timing: string | null
          raw_answers: Json
          skill_level: Database["public"]["Enums"]["skill_level"] | null
          student_age: number | null
          urgency: Database["public"]["Enums"]["urgency_level"] | null
        }
        Insert: {
          budget?: Database["public"]["Enums"]["budget_level"] | null
          country?: string | null
          created_at?: string
          goal?: Database["public"]["Enums"]["learning_goal"] | null
          id?: string
          instrument?: string | null
          lead_id: string
          learning_format?: string | null
          preferred_timing?: string | null
          raw_answers?: Json
          skill_level?: Database["public"]["Enums"]["skill_level"] | null
          student_age?: number | null
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
        }
        Update: {
          budget?: Database["public"]["Enums"]["budget_level"] | null
          country?: string | null
          created_at?: string
          goal?: Database["public"]["Enums"]["learning_goal"] | null
          id?: string
          instrument?: string | null
          lead_id?: string
          learning_format?: string | null
          preferred_timing?: string | null
          raw_answers?: Json
          skill_level?: Database["public"]["Enums"]["skill_level"] | null
          student_age?: number | null
          urgency?: Database["public"]["Enums"]["urgency_level"] | null
        }
        Relationships: [
          {
            foreignKeyName: "qualification_responses_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      reengagement_campaigns: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          subject: string | null
          trigger_days: number
          type: Database["public"]["Enums"]["reengagement_type"]
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          subject?: string | null
          trigger_days: number
          type: Database["public"]["Enums"]["reengagement_type"]
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          subject?: string | null
          trigger_days?: number
          type?: Database["public"]["Enums"]["reengagement_type"]
          updated_at?: string
        }
        Relationships: []
      }
      reengagement_sends: {
        Row: {
          campaign_id: string | null
          id: string
          lead_id: string
          outcome: string | null
          recovered: boolean
          revenue_recovered: number | null
          sent_at: string
        }
        Insert: {
          campaign_id?: string | null
          id?: string
          lead_id: string
          outcome?: string | null
          recovered?: boolean
          revenue_recovered?: number | null
          sent_at?: string
        }
        Update: {
          campaign_id?: string | null
          id?: string
          lead_id?: string
          outcome?: string | null
          recovered?: boolean
          revenue_recovered?: number | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reengagement_sends_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "reengagement_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reengagement_sends_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string | null
          created_at: string
          id: string
          lead_id: string | null
          metadata: Json
          platform: string | null
          rating: number | null
          request_sent_at: string | null
          responded: boolean
          review_received_at: string | null
          review_url: string | null
          reviewer_name: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          platform?: string | null
          rating?: number | null
          request_sent_at?: string | null
          responded?: boolean
          review_received_at?: string | null
          review_url?: string | null
          reviewer_name?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          lead_id?: string | null
          metadata?: Json
          platform?: string | null
          rating?: number | null
          request_sent_at?: string | null
          responded?: boolean
          review_received_at?: string | null
          review_url?: string | null
          reviewer_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          description: string | null
          due_at: string | null
          id: string
          lead_id: string | null
          priority: Database["public"]["Enums"]["task_priority"]
          rule_source: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          rule_source?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"]
          rule_source?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_heartbeats: {
        Row: {
          id: string
          last_tick_at: string | null
          last_tick_error: string | null
          started_at: string
          status: string
          ticks: number
          totals: Json
          updated_at: string
        }
        Insert: {
          id?: string
          last_tick_at?: string | null
          last_tick_error?: string | null
          started_at?: string
          status?: string
          ticks?: number
          totals?: Json
          updated_at?: string
        }
        Update: {
          id?: string
          last_tick_at?: string | null
          last_tick_error?: string | null
          started_at?: string
          status?: string
          ticks?: number
          totals?: Json
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_team_member: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      ad_entity_level: "campaign" | "adset" | "ad" | "keyword" | "ad_group"
      ad_platform: "meta" | "google"
      ad_reco_priority: "low" | "normal" | "high" | "critical"
      ad_reco_status: "pending" | "approved" | "dismissed" | "applied"
      app_role: "admin" | "sales" | "marketing" | "viewer"
      brief_period: "daily" | "weekly" | "monthly"
      budget_level: "low" | "medium" | "high" | "premium"
      content_kind:
        | "post"
        | "reel"
        | "story"
        | "blog"
        | "email"
        | "template"
        | "video"
        | "carousel"
      content_status:
        | "idea"
        | "draft"
        | "approved"
        | "scheduled"
        | "published"
        | "archived"
      copilot_role: "user" | "assistant" | "system"
      insight_priority: "low" | "normal" | "high" | "critical"
      lead_label:
        | "hot"
        | "warm"
        | "cold"
        | "high_value"
        | "nri"
        | "parent"
        | "adult_learner"
        | "certification"
        | "professional"
      lead_source:
        | "website"
        | "facebook_ads"
        | "instagram_ads"
        | "whatsapp"
        | "google_ads"
        | "organic"
        | "referral"
        | "manual"
        | "other"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "assessment_scheduled"
        | "assessment_completed"
        | "enrollment_pending"
        | "enrolled"
        | "lost"
        | "dormant"
        | "re_engagement"
      learning_goal:
        | "hobby"
        | "certification"
        | "professional"
        | "teacher_training"
      notification_type:
        | "new_lead"
        | "hot_lead"
        | "dormant_lead"
        | "recovered_lead"
        | "assessment_scheduled"
        | "followup_required"
        | "system"
      reengagement_type:
        | "soft_reminder"
        | "limited_offer"
        | "new_program"
        | "success_story"
        | "certification_reminder"
        | "personalized"
      skill_level: "beginner" | "intermediate" | "advanced"
      task_priority: "low" | "normal" | "high" | "urgent"
      task_status: "pending" | "in_progress" | "done" | "cancelled"
      urgency_level: "low" | "medium" | "high" | "immediate"
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
      ad_entity_level: ["campaign", "adset", "ad", "keyword", "ad_group"],
      ad_platform: ["meta", "google"],
      ad_reco_priority: ["low", "normal", "high", "critical"],
      ad_reco_status: ["pending", "approved", "dismissed", "applied"],
      app_role: ["admin", "sales", "marketing", "viewer"],
      brief_period: ["daily", "weekly", "monthly"],
      budget_level: ["low", "medium", "high", "premium"],
      content_kind: [
        "post",
        "reel",
        "story",
        "blog",
        "email",
        "template",
        "video",
        "carousel",
      ],
      content_status: [
        "idea",
        "draft",
        "approved",
        "scheduled",
        "published",
        "archived",
      ],
      copilot_role: ["user", "assistant", "system"],
      insight_priority: ["low", "normal", "high", "critical"],
      lead_label: [
        "hot",
        "warm",
        "cold",
        "high_value",
        "nri",
        "parent",
        "adult_learner",
        "certification",
        "professional",
      ],
      lead_source: [
        "website",
        "facebook_ads",
        "instagram_ads",
        "whatsapp",
        "google_ads",
        "organic",
        "referral",
        "manual",
        "other",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "assessment_scheduled",
        "assessment_completed",
        "enrollment_pending",
        "enrolled",
        "lost",
        "dormant",
        "re_engagement",
      ],
      learning_goal: [
        "hobby",
        "certification",
        "professional",
        "teacher_training",
      ],
      notification_type: [
        "new_lead",
        "hot_lead",
        "dormant_lead",
        "recovered_lead",
        "assessment_scheduled",
        "followup_required",
        "system",
      ],
      reengagement_type: [
        "soft_reminder",
        "limited_offer",
        "new_program",
        "success_story",
        "certification_reminder",
        "personalized",
      ],
      skill_level: ["beginner", "intermediate", "advanced"],
      task_priority: ["low", "normal", "high", "urgent"],
      task_status: ["pending", "in_progress", "done", "cancelled"],
      urgency_level: ["low", "medium", "high", "immediate"],
    },
  },
} as const
