from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.meetings.models import Meeting

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transcript(request, pk):
    meeting = Meeting.objects.filter(id=pk, user=request.user).first()
    if not meeting:
        return Response({'detail': 'Not found.'}, status=404)
    if not meeting.has_transcript:
        return Response({'detail': 'Transcript not yet available.'}, status=404)
    from apps.meetings.serializers import MeetingTranscriptSerializer
    return Response(MeetingTranscriptSerializer(meeting.transcript).data)

urlpatterns = [
    path('<uuid:pk>/transcript/', get_transcript, name='get-transcript'),
]
