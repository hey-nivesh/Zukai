// ==============================================================================
// Database Schema Type Definitions (Generated / Codified for Zukai)
// Location: /zukai/src/types/database.ts
// Command: npm run db:types
// ==============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type OrgRole = 'owner' | 'admin' | 'member';
export type DocStatus = 'uploading' | 'uploaded' | 'ready' | 'failed' | 'deleted';
export type JobStatus =
  | 'queued'
  | 'extracting'
  | 'scripting'
  | 'voicing'
  | 'assembling'
  | 'ready'
  | 'failed'
  | 'canceled';
export type AudioLanguage = 'english' | 'hinglish';
export type DepthMode = 'quick' | 'standard' | 'deep';
export type PlanTier = 'free' | 'pro' | 'team' | 'enterprise';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          preferred_language: 'english' | 'hinglish';
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          preferred_language?: 'english' | 'hinglish';
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          preferred_language?: 'english' | 'hinglish';
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string;
          created_by: string;
          plan_tier: PlanTier;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          created_by: string;
          plan_tier?: PlanTier;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          created_by?: string;
          plan_tier?: PlanTier;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      memberships: {
        Row: {
          org_id: string;
          user_id: string;
          role: OrgRole;
          created_at: string;
        };
        Insert: {
          org_id: string;
          user_id: string;
          role?: OrgRole;
          created_at?: string;
        };
        Update: {
          org_id?: string;
          user_id?: string;
          role?: OrgRole;
          created_at?: string;
        };
        Relationships: [];
      };
      invitations: {
        Row: {
          id: string;
          org_id: string;
          email: string;
          role: OrgRole;
          token_hash: string;
          invited_by: string | null;
          expires_at: string;
          accepted_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          org_id: string;
          email: string;
          role?: OrgRole;
          token_hash: string;
          invited_by?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          org_id?: string;
          email?: string;
          role?: OrgRole;
          token_hash?: string;
          invited_by?: string | null;
          expires_at?: string;
          accepted_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          owner_id: string;
          org_id: string | null;
          title: string;
          original_filename: string;
          mime_type: string;
          file_size_bytes: number;
          storage_path: string;
          page_count: number | null;
          word_count: number | null;
          source_language: string | null;
          status: DocStatus;
          error_code: string | null;
          deleted_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          org_id?: string | null;
          title: string;
          original_filename: string;
          mime_type: string;
          file_size_bytes: number;
          storage_path: string;
          page_count?: number | null;
          word_count?: number | null;
          source_language?: string | null;
          status?: DocStatus;
          error_code?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          org_id?: string | null;
          title?: string;
          original_filename?: string;
          mime_type?: string;
          file_size_bytes?: number;
          storage_path?: string;
          page_count?: number | null;
          word_count?: number | null;
          source_language?: string | null;
          status?: DocStatus;
          error_code?: string | null;
          deleted_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audio_jobs: {
        Row: {
          id: string;
          document_id: string;
          owner_id: string;
          org_id: string | null;
          language: AudioLanguage;
          depth: DepthMode;
          voice: string;
          status: JobStatus;
          progress: number;
          current_step: string | null;
          error_code: string | null;
          error_message: string | null;
          attempt_count: number;
          input_tokens: number;
          output_tokens: number;
          tts_characters: number;
          cost_micros: number;
          started_at: string | null;
          finished_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          owner_id: string;
          org_id?: string | null;
          language?: AudioLanguage;
          depth?: DepthMode;
          voice?: string;
          status?: JobStatus;
          progress?: number;
          current_step?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          attempt_count?: number;
          input_tokens?: number;
          output_tokens?: number;
          tts_characters?: number;
          cost_micros?: number;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          document_id?: string;
          owner_id?: string;
          org_id?: string | null;
          language?: AudioLanguage;
          depth?: DepthMode;
          voice?: string;
          status?: JobStatus;
          progress?: number;
          current_step?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          attempt_count?: number;
          input_tokens?: number;
          output_tokens?: number;
          tts_characters?: number;
          cost_micros?: number;
          started_at?: string | null;
          finished_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      audio_tracks: {
        Row: {
          id: string;
          job_id: string;
          document_id: string;
          owner_id: string;
          org_id: string | null;
          storage_path: string;
          duration_seconds: number;
          format: string;
          bitrate_kbps: number;
          file_size_bytes: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          job_id: string;
          document_id: string;
          owner_id: string;
          org_id?: string | null;
          storage_path: string;
          duration_seconds: number;
          format?: string;
          bitrate_kbps?: number;
          file_size_bytes: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          job_id?: string;
          document_id?: string;
          owner_id?: string;
          org_id?: string | null;
          storage_path?: string;
          duration_seconds?: number;
          format?: string;
          bitrate_kbps?: number;
          file_size_bytes?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      chapters: {
        Row: {
          id: string;
          track_id: string;
          position: number;
          title: string;
          start_seconds: number;
          end_seconds: number;
          summary: string | null;
        };
        Insert: {
          id?: string;
          track_id: string;
          position: number;
          title: string;
          start_seconds: number;
          end_seconds: number;
          summary?: string | null;
        };
        Update: {
          id?: string;
          track_id?: string;
          position?: number;
          title?: string;
          start_seconds?: number;
          end_seconds?: number;
          summary?: string | null;
        };
        Relationships: [];
      };
      transcripts: {
        Row: {
          id: string;
          track_id: string;
          language: AudioLanguage;
          segments: Json;
          full_text: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          track_id: string;
          language?: AudioLanguage;
          segments: Json;
          full_text: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          track_id?: string;
          language?: AudioLanguage;
          segments?: Json;
          full_text?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      playback_progress: {
        Row: {
          user_id: string;
          track_id: string;
          position_seconds: number;
          speed: number;
          completed: boolean;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          track_id: string;
          position_seconds?: number;
          speed?: number;
          completed?: boolean;
          updated_at?: string;
        };
        Update: {
          user_id?: string;
          track_id?: string;
          position_seconds?: number;
          speed?: number;
          completed?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      plans: {
        Row: {
          tier: PlanTier;
          monthly_audio_minutes: number;
          max_file_size_mb: number;
          max_pages: number;
          max_documents: number;
          max_concurrent_jobs: number;
          offline_downloads: boolean;
          team_features: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          tier: PlanTier;
          monthly_audio_minutes: number;
          max_file_size_mb: number;
          max_pages: number;
          max_documents: number;
          max_concurrent_jobs: number;
          offline_downloads?: boolean;
          team_features?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          tier?: PlanTier;
          monthly_audio_minutes?: number;
          max_file_size_mb?: number;
          max_pages?: number;
          max_documents?: number;
          max_concurrent_jobs?: number;
          offline_downloads?: boolean;
          team_features?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          org_id: string | null;
          tier: PlanTier;
          status: string;
          provider: string;
          provider_customer_id: string | null;
          current_period_end: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          org_id?: string | null;
          tier?: PlanTier;
          status?: string;
          provider?: string;
          provider_customer_id?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          org_id?: string | null;
          tier?: PlanTier;
          status?: string;
          provider?: string;
          provider_customer_id?: string | null;
          current_period_end?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      usage_events: {
        Row: {
          id: string;
          owner_id: string;
          org_id: string | null;
          job_id: string | null;
          event_type: 'audio_minutes' | 'document' | 'tokens' | 'tts_chars';
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          org_id?: string | null;
          job_id?: string | null;
          event_type: 'audio_minutes' | 'document' | 'tokens' | 'tts_chars';
          quantity: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          org_id?: string | null;
          job_id?: string | null;
          event_type?: 'audio_minutes' | 'document' | 'tokens' | 'tts_chars';
          quantity?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          org_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          metadata: Json;
          ip: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          org_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          metadata?: Json;
          ip?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          actor_id?: string | null;
          org_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          metadata?: Json;
          ip?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      create_organization: {
        Args: {
          p_name: string;
          p_slug: string;
        };
        Returns: Database['public']['Tables']['organizations']['Row'];
      };
      create_audio_job: {
        Args: {
          p_document_id: string;
          p_language: AudioLanguage;
          p_depth: DepthMode;
          p_voice: string;
        };
        Returns: Database['public']['Tables']['audio_jobs']['Row'];
      };
      cancel_audio_job: {
        Args: {
          p_job_id: string;
        };
        Returns: Database['public']['Tables']['audio_jobs']['Row'];
      };
      soft_delete_document: {
        Args: {
          p_document_id: string;
        };
        Returns: boolean;
      };
      complete_document_upload: {
        Args: {
          p_document_id: string;
        };
        Returns: Database['public']['Tables']['documents']['Row'];
      };
      update_playback_progress: {
        Args: {
          p_track_id: string;
          p_position_seconds: number;
          p_speed: number;
          p_completed: boolean;
        };
        Returns: Database['public']['Tables']['playback_progress']['Row'];
      };
      get_usage_summary: {
        Args: {
          p_org_id: string | null;
        };
        Returns: {
          tier: PlanTier;
          monthly_audio_minutes_limit: number;
          monthly_audio_minutes_used: number;
          max_documents_limit: number;
          documents_count: number;
          active_jobs_count: number;
          period_start: string;
          period_end: string;
        };
      };
    };
    Enums: {
      org_role: OrgRole;
      doc_status: DocStatus;
      job_status: JobStatus;
      audio_language: AudioLanguage;
      depth_mode: DepthMode;
      plan_tier: PlanTier;
    };
  };
}
