"""
Bot views — CRUD for BotSession + manual trigger for summary email.
"""

import threading
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .models import BotSession
from .serializers import BotSessionSerializer, CreateBotSessionSerializer
from .email_service import send_meeting_summary_email, collect_recipient_emails


class BotSessionListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CreateBotSessionSerializer
        return BotSessionSerializer

    def get_queryset(self):
        return BotSession.objects.filter(user=self.request.user).select_related('meeting')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save(user=request.user)
        out = BotSessionSerializer(instance)
        return Response(out.data, status=status.HTTP_201_CREATED)


class BotSessionDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = BotSessionSerializer

    def get_queryset(self):
        return BotSession.objects.filter(user=self.request.user)

    def update(self, request, *args, **kwargs):
        """Allow partial status updates (e.g. cancelling)."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        # Only allow updating certain fields
        allowed = {'status', 'meeting_title', 'send_to_organizer', 'send_to_participants', 'participants_email_override'}
        data = {k: v for k, v in request.data.items() if k in allowed}
        serializer = self.get_serializer(instance, data=data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_summary_email_view(request, pk):
    """
    Manually trigger sending the meeting summary email for a completed bot session.
    POST /api/bots/<pk>/send-summary/
    """
    try:
        bot = BotSession.objects.get(pk=pk, user=request.user)
    except BotSession.DoesNotExist:
        return Response({'detail': 'Bot session not found.'}, status=status.HTTP_404_NOT_FOUND)

    if not bot.meeting:
        return Response({'detail': 'No meeting linked to this bot session.'}, status=status.HTTP_400_BAD_REQUEST)

    meeting = bot.meeting
    insights = getattr(meeting, 'insights', None)
    transcript = getattr(meeting, 'transcript', None)

    recipients = collect_recipient_emails(bot, meeting)
    if not recipients:
        return Response({'detail': 'No recipients configured. Set send_to_organizer or add participant emails.'}, status=status.HTTP_400_BAD_REQUEST)

    def _send():
        ok = send_meeting_summary_email(meeting, recipients, insights, transcript)
        if ok:
            bot.summary_sent = True
            bot.save(update_fields=['summary_sent'])

    thread = threading.Thread(target=_send, daemon=True)
    thread.start()

    return Response({'detail': f'Summary email queued for {len(recipients)} recipient(s).', 'recipients': recipients})
