from django.urls import path
from .views import (
    MeetingListCreateView, MeetingDetailView,
    upload_meeting, transcribe_meeting, meeting_status, retry_pipeline,
    get_transcript, get_insights, regenerate_insights, get_audio_url,
    dashboard_stats,
)

urlpatterns = [
    path('', MeetingListCreateView.as_view(), name='meeting-list'),
    path('stats/', dashboard_stats, name='meeting-stats'),
    path('<uuid:pk>/', MeetingDetailView.as_view(), name='meeting-detail'),
    path('<uuid:pk>/upload/', upload_meeting, name='meeting-upload'),
    path('<uuid:pk>/transcribe/', transcribe_meeting, name='meeting-transcribe'),
    path('<uuid:pk>/status/', meeting_status, name='meeting-status'),
    path('<uuid:pk>/retry/', retry_pipeline, name='meeting-retry'),
    path('<uuid:pk>/transcript/', get_transcript, name='meeting-transcript'),
    path('<uuid:pk>/insights/', get_insights, name='meeting-insights'),
    path('<uuid:pk>/regenerate-insights/', regenerate_insights, name='meeting-regenerate-insights'),
    path('<uuid:pk>/audio-url/', get_audio_url, name='meeting-audio-url'),
]
