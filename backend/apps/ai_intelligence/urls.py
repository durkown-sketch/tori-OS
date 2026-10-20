from django.urls import path
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.meetings.models import Meeting

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_insights(request, pk):
    meeting = Meeting.objects.filter(id=pk, user=request.user).first()
    if not meeting:
        return Response({'detail': 'Not found.'}, status=404)
    if not meeting.has_insights:
        return Response({'detail': 'Insights not yet available.'}, status=404)
    from apps.meetings.serializers import MeetingInsightsSerializer
    return Response(MeetingInsightsSerializer(meeting.insights).data)

urlpatterns = [
    path('<uuid:pk>/insights/', get_insights, name='get-insights'),
]
