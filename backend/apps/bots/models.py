import uuid
from django.db import models
from django.conf import settings


class BotSession(models.Model):
    """Represents a ToriOS bot scheduled to join a meeting."""

    Platform = models.TextChoices('Platform', 'google_meet zoom')
    Status = models.TextChoices('Status', 'scheduled joining active completed failed cancelled')

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bot_sessions')

    # Meeting info
    meeting_title = models.CharField(max_length=500)
    platform = models.CharField(max_length=20, choices=[('google_meet', 'Google Meet'), ('zoom', 'Zoom')])
    meeting_url = models.URLField(max_length=1000)

    # Scheduling
    scheduled_at = models.DateTimeField(null=True, blank=True)
    started_at = models.DateTimeField(null=True, blank=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    # Status
    status = models.CharField(max_length=20, default='scheduled',
                               choices=[
                                   ('scheduled', 'Scheduled'),
                                   ('joining', 'Joining'),
                                   ('active', 'Active'),
                                   ('completed', 'Completed'),
                                   ('failed', 'Failed'),
                                   ('cancelled', 'Cancelled'),
                               ])
    error_message = models.TextField(blank=True, default='')

    # Email delivery
    send_to_organizer = models.BooleanField(default=True)
    send_to_participants = models.BooleanField(default=True)
    participants_email_override = models.TextField(
        blank=True, default='',
        help_text='Comma-separated list of extra email addresses to send summary to.'
    )
    summary_sent = models.BooleanField(default=False)

    # Link to resulting meeting record
    meeting = models.OneToOneField(
        'meetings.Meeting', null=True, blank=True,
        on_delete=models.SET_NULL, related_name='bot_session'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Bot Session'
        verbose_name_plural = 'Bot Sessions'

    def __str__(self):
        return f'{self.meeting_title} [{self.platform}] — {self.status}'
