import apiClient from './client';
import type {
  AuthResponse, LoginRequest, RegisterRequest, User,
  Meeting, MeetingDetail, CreateMeetingRequest, UpdateMeetingRequest,
  PaginatedResponse, MeetingsParams, Transcript, MeetingInsights,
  DashboardStats, UploadProgress,
} from '../types';

// ── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login/', data).then((r) => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>('/auth/register/', data).then((r) => r.data),

  logout: (refresh: string) =>
    apiClient.post('/auth/logout/', { refresh }).then((r) => r.data),

  refreshToken: (refresh: string) =>
    apiClient.post<{ access: string; refresh?: string }>('/auth/token/refresh/', { refresh }).then((r) => r.data),

  getMe: () =>
    apiClient.get<User>('/auth/me/').then((r) => r.data),

  updateProfile: (data: Partial<Pick<User, 'full_name' | 'organization'>>) =>
    apiClient.patch<User>('/auth/me/', data).then((r) => r.data),
};

// ── Meetings ──────────────────────────────────────────────────────────────────
export const meetingsApi = {
  list: (params?: MeetingsParams) =>
    apiClient
      .get<PaginatedResponse<Meeting>>('/meetings/', { params })
      .then((r) => r.data),

  create: (data: CreateMeetingRequest) =>
    apiClient.post<Meeting>('/meetings/', data).then((r) => r.data),

  get: (id: string) =>
    apiClient.get<MeetingDetail>(`/meetings/${id}/`).then((r) => r.data),

  update: (id: string, data: UpdateMeetingRequest) =>
    apiClient.patch<Meeting>(`/meetings/${id}/`, data).then((r) => r.data),

  delete: (id: string) =>
    apiClient.delete(`/meetings/${id}/`).then((r) => r.data),

  upload: (
    id: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ) => {
    const formData = new FormData();
    formData.append('audio_file', file);
    return apiClient
      .post<Meeting>(`/meetings/${id}/upload/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (evt) => {
          if (onProgress && evt.total) {
            onProgress({
              loaded: evt.loaded,
              total: evt.total,
              percentage: Math.round((evt.loaded / evt.total) * 100),
            });
          }
        },
      })
      .then((r) => r.data);
  },

  getStatus: (id: string) =>
    apiClient.get<{ status: string; error_message?: string }>(`/meetings/${id}/status/`).then((r) => r.data),

  transcribe: (id: string) =>
    apiClient.post<{ message: string }>(`/meetings/${id}/transcribe/`).then((r) => r.data),

  retryProcessing: (id: string) =>
    apiClient.post<{ message: string }>(`/meetings/${id}/retry/`).then((r) => r.data),

  getTranscript: (id: string) =>
    apiClient.get<Transcript>(`/meetings/${id}/transcript/`).then((r) => r.data),

  getInsights: (id: string) =>
    apiClient.get<MeetingInsights>(`/meetings/${id}/insights/`).then((r) => r.data),

  regenerateInsights: (id: string) =>
    apiClient.post<{ message: string }>(`/meetings/${id}/regenerate-insights/`).then((r) => r.data),

  getAudioUrl: (id: string) =>
    apiClient.get<{ url: string }>(`/meetings/${id}/audio-url/`).then((r) => r.data),
};

// ── Dashboard Stats ───────────────────────────────────────────────────────────
export const statsApi = {
  getDashboard: () =>
    apiClient.get<DashboardStats>('/meetings/stats/').then((r) => r.data),
};
