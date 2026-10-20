import os
import threading
import logging
from django.conf import settings
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import Meeting, MeetingTranscript, MeetingInsights, ProcessingStatus
from .serializers import (
    MeetingListSerializer, MeetingDetailSerializer,
    CreateMeetingSerializer,
)

logger = logging.getLogger(__name__)


def _validate_audio_file(file):
    """Validate uploaded audio file extension and size."""
    ext = os.path.splitext(file.name)[1].lower()
    if ext not in settings.ALLOWED_AUDIO_EXTENSIONS:
        return False, f"Unsupported file type '{ext}'. Allowed: {', '.join(settings.ALLOWED_AUDIO_EXTENSIONS)}"
    max_bytes = settings.MAX_AUDIO_FILE_SIZE_MB * 1024 * 1024
    if file.size > max_bytes:
        return False, f"File too large. Maximum is {settings.MAX_AUDIO_FILE_SIZE_MB} MB."
    return True, None


def _run_pipeline(meeting_id: str):
    """Run transcription + AI pipeline in a background thread."""
    from apps.transcription.service import TranscriptionService
    from apps.ai_intelligence.service import AIIntelligenceService

    try:
        meeting = Meeting.objects.get(id=meeting_id)
        meeting.status = ProcessingStatus.TRANSCRIBING
        meeting.save(update_fields=['status'])

        transcript_text, segments, language = TranscriptionService.transcribe(meeting)

        MeetingTranscript.objects.update_or_create(
            meeting=meeting,
            defaults={
                'full_text': transcript_text,
                'segments': segments,
                'language': language or '',
                'provider': 'whisper',
                'word_count': len(transcript_text.split()),
            }
        )

        meeting.status = ProcessingStatus.GENERATING
        meeting.save(update_fields=['status'])

        insights_data = AIIntelligenceService.generate_insights(transcript_text)

        MeetingInsights.objects.update_or_create(
            meeting=meeting,
            defaults=insights_data,
        )

        meeting.status = ProcessingStatus.COMPLETED
        meeting.error_message = ''
        meeting.save(update_fields=['status', 'error_message'])
        logger.info(f"Pipeline complete for meeting {meeting_id}")

    except Exception as exc:
        logger.exception(f"Pipeline failed for meeting {meeting_id}: {exc}")
        try:
            m = Meeting.objects.get(id=meeting_id)
            m.status = ProcessingStatus.FAILED
            m.error_message = str(exc)
            m.processing_attempts += 1
            m.save(update_fields=['status', 'error_message', 'processing_attempts'])
        except Exception:
            pass


class MeetingListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateMeetingSerializer
        return MeetingListSerializer

    def get_queryset(self):
        qs = Meeting.objects.filter(user=self.request.user)
        # Support both 'search' and 'q' query params
        q = self.request.query_params.get('search', '') or self.request.query_params.get('q', '')
        q = q.strip()
        if q:
            from django.db.models import Q
            qs = qs.filter(
                Q(title__icontains=q) | Q(transcript__full_text__icontains=q)
            ).distinct()
        status_filter = self.request.query_params.get('status', '').strip()
        if status_filter:
            qs = qs.filter(status=status_filter)
        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class MeetingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = MeetingDetailSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Meeting.objects.filter(user=self.request.user).select_related('transcript', 'insights')

    def destroy(self, request, *args, **kwargs):
        meeting = self.get_object()
        # Clean up Supabase storage if file exists
        if meeting.audio_file_path:
            try:
                from apps.transcription.service import StorageService
                StorageService.delete_file(meeting.audio_file_path)
            except Exception as e:
                logger.warning(f"Could not delete storage file: {e}")
        return super().destroy(request, *args, **kwargs)


@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def upload_meeting(request, pk):
    """Upload audio to a meeting record and queue the pipeline."""
    meeting = Meeting.objects.filter(id=pk, user=request.user).first()
    if not meeting:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

    # Accept either 'audio_file' (frontend) or 'file' (legacy)
    file = request.FILES.get('audio_file') or request.FILES.get('file')
    if not file:
        return Response({'detail': 'No file provided. Send as audio_file.'}, status=status.HTTP_400_BAD_REQUEST)

    valid, error = _validate_audio_file(file)
    if not valid:
        return Response({'detail': error}, status=status.HTTP_400_BAD_REQUEST)

    # Store to Supabase
    try:
        from apps.transcription.service import StorageService
        path, url = StorageService.upload_file(file, str(request.user.id))
    except Exception as e:
        logger.exception(f"Storage upload failed: {e}")
        return Response({'detail': f'Upload failed: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    meeting.audio_file_path = path
    meeting.audio_file_name = file.name
    meeting.audio_file_size = file.size
    meeting.audio_url = url
    if request.data.get('title'):
        meeting.title = request.data['title']
    meeting.status = ProcessingStatus.QUEUED
    meeting.save()

    return Response(MeetingDetailSerializer(meeting).data, status=status.HTTP_202_ACCEPTED)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def transcribe_meeting(request, pk):
    """Kick off the transcription pipeline for a meeting."""
    meeting = Meeting.objects.filter(id=pk, user=request.user).first()
    if not meeting:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    if not meeting.audio_file_path:
        return Response({'detail': 'No audio file uploaded yet.'}, status=status.HTTP_400_BAD_REQUEST)
    if meeting.status in [ProcessingStatus.TRANSCRIBING, ProcessingStatus.GENERATING]:
        return Response({'detail': 'Already processing.'}, status=status.HTTP_409_CONFLICT)

    meeting.status = ProcessingStatus.QUEUED
    meeting.error_message = ''
    meeting.save(update_fields=['status', 'error_message'])

    t = threading.Thread(target=_run_pipeline, args=(str(meeting.id),), daemon=True)
    t.start()
    return Response({'message': 'Transcription pipeline started.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def meeting_status(request, pk):
    meeting = Meeting.objects.filter(id=pk, user=request.user).first()
    if not meeting:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    return Response({
        'id': str(meeting.id),
        'status': meeting.status,
        'error_message': meeting.error_message,
        'has_transcript': meeting.has_transcript,
        'has_insights': meeting.has_insights,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def retry_pipeline(request, pk):
    meeting = Meeting.objects.filter(id=pk, user=request.user).first()
    if not meeting:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    if meeting.status not in [ProcessingStatus.FAILED]:
        return Response({'detail': 'Can only retry failed meetings.'}, status=status.HTTP_400_BAD_REQUEST)
    if not meeting.audio_file_path:
        return Response({'detail': 'No audio file to process.'}, status=status.HTTP_400_BAD_REQUEST)

    meeting.status = ProcessingStatus.QUEUED
    meeting.error_message = ''
    meeting.save(update_fields=['status', 'error_message'])

    t = threading.Thread(target=_run_pipeline, args=(str(meeting.id),), daemon=True)
    t.start()
    return Response({'message': 'Pipeline restarted.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transcript(request, pk):
    from .serializers import MeetingTranscriptSerializer
    meeting = Meeting.objects.filter(id=pk, user=request.user).first()
    if not meeting:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    if not hasattr(meeting, 'transcript') or not meeting.transcript:
        return Response({'detail': 'No transcript available.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(MeetingTranscriptSerializer(meeting.transcript).data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_insights(request, pk):
    from .serializers import MeetingInsightsSerializer
    meeting = Meeting.objects.filter(id=pk, user=request.user).first()
    if not meeting:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    if not hasattr(meeting, 'insights') or not meeting.insights:
        return Response({'detail': 'No insights available.'}, status=status.HTTP_404_NOT_FOUND)
    return Response(MeetingInsightsSerializer(meeting.insights).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def regenerate_insights(request, pk):
    from apps.ai_intelligence.service import AIIntelligenceService
    meeting = Meeting.objects.filter(id=pk, user=request.user).select_related('transcript').first()
    if not meeting:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    if not hasattr(meeting, 'transcript') or not meeting.transcript:
        return Response({'detail': 'No transcript available. Transcribe first.'}, status=status.HTTP_400_BAD_REQUEST)

    def _regen(meeting_id, transcript_text):
        try:
            m = Meeting.objects.get(id=meeting_id)
            m.status = ProcessingStatus.GENERATING
            m.save(update_fields=['status'])
            data = AIIntelligenceService.generate_insights(transcript_text)
            MeetingInsights.objects.update_or_create(meeting=m, defaults=data)
            m.status = ProcessingStatus.COMPLETED
            m.save(update_fields=['status'])
        except Exception as exc:
            logger.exception(f"Regenerate insights failed: {exc}")
            try:
                m = Meeting.objects.get(id=meeting_id)
                m.status = ProcessingStatus.FAILED
                m.error_message = str(exc)
                m.save(update_fields=['status', 'error_message'])
            except Exception:
                pass

    t = threading.Thread(target=_regen, args=(str(meeting.id), meeting.transcript.full_text), daemon=True)
    t.start()
    return Response({'message': 'Insight regeneration started.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_audio_url(request, pk):
    """Return a (signed) URL to stream the meeting audio."""
    meeting = Meeting.objects.filter(id=pk, user=request.user).first()
    if not meeting:
        return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
    if not meeting.audio_file_path:
        return Response({'detail': 'No audio file available.'}, status=status.HTTP_404_NOT_FOUND)
    try:
        from apps.transcription.service import StorageService
        url = StorageService.get_signed_url(meeting.audio_file_path)
        return Response({'url': url})
    except Exception:
        # Fall back to stored public URL if available
        if meeting.audio_url:
            return Response({'url': meeting.audio_url})
        return Response({'detail': 'Could not generate audio URL.'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_stats(request):
    qs = Meeting.objects.filter(user=request.user)
    return Response({
        'total_meetings': qs.count(),
        'completed_meetings': qs.filter(status=ProcessingStatus.COMPLETED).count(),
        'pending_meetings': qs.filter(status__in=[
            ProcessingStatus.QUEUED,
            ProcessingStatus.TRANSCRIBING,
            ProcessingStatus.GENERATING,
            ProcessingStatus.UPLOADED,
        ]).count(),
        'failed_meetings': qs.filter(status=ProcessingStatus.FAILED).count(),
    })
