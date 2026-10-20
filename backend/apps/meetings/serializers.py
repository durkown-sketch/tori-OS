from rest_framework import serializers
from .models import Meeting, MeetingTranscript, MeetingInsights


class MeetingTranscriptSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeetingTranscript
        fields = ['id', 'full_text', 'language', 'provider', 'segments',
                  'word_count', 'created_at', 'updated_at']
        read_only_fields = fields


class MeetingInsightsSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeetingInsights
        fields = ['id', 'executive_summary', 'detailed_notes', 'key_points',
                  'decisions', 'action_items', 'unresolved_questions', 'topics',
                  'provider', 'model_used', 'created_at', 'updated_at']
        read_only_fields = fields


class MeetingListSerializer(serializers.ModelSerializer):
    has_transcript = serializers.BooleanField(read_only=True)
    has_insights = serializers.BooleanField(read_only=True)

    class Meta:
        model = Meeting
        fields = [
            'id', 'title', 'status', 'error_message',
            'audio_duration_seconds', 'audio_file_name', 'audio_file_size',
            'has_transcript', 'has_insights', 'processing_attempts',
            'recorded_at', 'created_at', 'updated_at',
        ]
        read_only_fields = fields


class MeetingDetailSerializer(serializers.ModelSerializer):
    transcript = MeetingTranscriptSerializer(read_only=True)
    insights = MeetingInsightsSerializer(read_only=True)
    has_transcript = serializers.BooleanField(read_only=True)
    has_insights = serializers.BooleanField(read_only=True)

    class Meta:
        model = Meeting
        fields = [
            'id', 'title', 'description', 'status', 'error_message',
            'audio_file_name', 'audio_file_size', 'audio_file_path',
            'audio_duration_seconds', 'audio_url',
            'has_transcript', 'has_insights', 'processing_attempts',
            'transcript', 'insights',
            'recorded_at', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'status', 'error_message', 'audio_file_path',
            'has_transcript', 'has_insights', 'processing_attempts',
            'created_at', 'updated_at',
        ]


class CreateMeetingSerializer(serializers.ModelSerializer):
    class Meta:
        model = Meeting
        fields = ['title', 'description', 'recorded_at']


class UploadMeetingSerializer(serializers.Serializer):
    file = serializers.FileField()
    title = serializers.CharField(max_length=500, required=False)
