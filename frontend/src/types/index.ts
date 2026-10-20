// ── User ────────────────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  organization?: string;
  created_at: string;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  password2: string;
  full_name: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

// ── Processing Status ─────────────────────────────────────────────────────────
export type ProcessingStatus =
  | 'uploaded'
  | 'queued'
  | 'transcribing'
  | 'generating'
  | 'completed'
  | 'failed';

// ── Meeting ───────────────────────────────────────────────────────────────────
export interface Meeting {
  id: string;
  title: string;
  description?: string;
  audio_file_name?: string;
  audio_file_size?: number;
  audio_duration_seconds?: number;
  audio_url?: string;
  status: ProcessingStatus;
  error_message?: string;
  processing_attempts: number;
  recorded_at?: string;
  created_at: string;
  updated_at: string;
  has_transcript: boolean;
  has_insights: boolean;
}

export interface MeetingListItem extends Meeting {}

export interface CreateMeetingRequest {
  title: string;
  description?: string;
}

export interface UpdateMeetingRequest {
  title?: string;
  description?: string;
}

// ── Transcript ────────────────────────────────────────────────────────────────
export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

export interface Transcript {
  id: string;
  meeting: string;
  full_text: string;
  language?: string;
  provider?: string;
  segments: TranscriptSegment[];
  word_count: number;
  created_at: string;
}

// ── Action Item ───────────────────────────────────────────────────────────────
export interface ActionItem {
  task: string;
  owner?: string;
  deadline?: string;
  priority?: 'high' | 'medium' | 'low';
  status?: 'pending' | 'done';
}

// ── Meeting Insights ──────────────────────────────────────────────────────────
export interface MeetingInsights {
  id: string;
  meeting: string;
  executive_summary: string;
  detailed_notes?: string;
  key_points: string[];
  decisions: string[];
  action_items: ActionItem[];
  unresolved_questions: string[];
  topics: string[];
  provider?: string;
  model_used?: string;
  created_at: string;
}

// ── Meeting Detail (full nested response) ────────────────────────────────────
export interface MeetingDetail extends Meeting {
  transcript?: Transcript;
  insights?: MeetingInsights;
}

// ── API Pagination ────────────────────────────────────────────────────────────
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ── Meetings Query Params ─────────────────────────────────────────────────────
export interface MeetingsParams {
  search?: string;
  status?: ProcessingStatus | '';
  page?: number;
  ordering?: string;
}

// ── Upload Progress ───────────────────────────────────────────────────────────
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// ── API Error ─────────────────────────────────────────────────────────────────
export interface ApiError {
  message: string;
  field_errors?: Record<string, string[]>;
  status?: number;
}

// ── Stats ─────────────────────────────────────────────────────────────────────
export interface DashboardStats {
  total_meetings: number;
  completed_meetings: number;
  pending_meetings: number;
  failed_meetings: number;
}
