import uuid
from django.db import models
from django.conf import settings


class ProcessingStatus(models.TextChoices):
    UPLOADED = 'uploaded', 'Uploaded'
    QUEUED = 'queued', 'Queued'
    TRANSCRIBING = 'transcribing', 'Transcribing'
    GENERATING = 'generating', 'Generating Insights'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'


class Meeting(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='meetings'
    )
    title = models.CharField(max_length=500, default='Untitled Meeting')
    description = models.TextField(blank=True)

    # Audio / file
    audio_file_path = models.CharField(max_length=1000, blank=True)  # Supabase Storage key
    audio_file_name = models.CharField(max_length=500, blank=True)
    audio_file_size = models.BigIntegerField(null=True, blank=True)
    audio_duration_seconds = models.IntegerField(null=True, blank=True)
    audio_url = models.URLField(max_length=2000, blank=True)

    # Processing
    status = models.CharField(
        max_length=30,
        choices=ProcessingStatus.choices,
        default=ProcessingStatus.UPLOADED
    )
    error_message = models.TextField(blank=True)
    processing_attempts = models.IntegerField(default=0)

    # Timestamps
    recorded_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meetings'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.user.email})"

    @property
    def has_transcript(self):
        return hasattr(self, 'transcript') and self.transcript is not None

    @property
    def has_insights(self):
        return hasattr(self, 'insights') and self.insights is not None


class MeetingTranscript(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    meeting = models.OneToOneField(
        Meeting, on_delete=models.CASCADE, related_name='transcript'
    )
    full_text = models.TextField()
    language = models.CharField(max_length=20, blank=True)
    provider = models.CharField(max_length=50, blank=True)
    segments = models.JSONField(default=list)  # [{start, end, text, speaker?}]
    word_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meeting_transcripts'


class MeetingInsights(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    meeting = models.OneToOneField(
        Meeting, on_delete=models.CASCADE, related_name='insights'
    )
    executive_summary = models.TextField(blank=True)
    detailed_notes = models.TextField(blank=True)
    key_points = models.JSONField(default=list)
    decisions = models.JSONField(default=list)
    action_items = models.JSONField(default=list)   # [{task, owner?, deadline?, priority?}]
    unresolved_questions = models.JSONField(default=list)
    topics = models.JSONField(default=list)
    provider = models.CharField(max_length=50, blank=True)
    model_used = models.CharField(max_length=100, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'meeting_insights'
