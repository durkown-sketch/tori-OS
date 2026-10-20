from rest_framework import serializers
from .models import BotSession


class BotSessionSerializer(serializers.ModelSerializer):
    meeting_id = serializers.SerializerMethodField()

    class Meta:
        model = BotSession
        fields = [
            'id', 'meeting_title', 'platform', 'meeting_url',
            'status', 'error_message',
            'send_to_organizer', 'send_to_participants', 'participants_email_override',
            'summary_sent', 'meeting_id',
            'scheduled_at', 'started_at', 'ended_at',
            'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'status', 'error_message', 'summary_sent',
            'started_at', 'ended_at', 'created_at', 'updated_at',
        ]

    def get_meeting_id(self, obj):
        return str(obj.meeting_id) if obj.meeting_id else None


class CreateBotSessionSerializer(serializers.ModelSerializer):
    class Meta:
        model = BotSession
        fields = [
            'meeting_title', 'platform', 'meeting_url',
            'scheduled_at',
            'send_to_organizer', 'send_to_participants',
            'participants_email_override',
        ]

    def validate_platform(self, value):
        if value not in ('google_meet', 'zoom'):
            raise serializers.ValidationError('Platform must be "google_meet" or "zoom".')
        return value

    def validate_meeting_url(self, value):
        lowered = value.lower()
        if 'meet.google.com' not in lowered and 'zoom.us' not in lowered and 'us0' not in lowered:
            # Allow any URL for flexibility but warn
            pass
        return value
