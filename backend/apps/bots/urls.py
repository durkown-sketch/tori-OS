from django.urls import path
from .views import BotSessionListCreateView, BotSessionDetailView, send_summary_email_view

urlpatterns = [
    path('', BotSessionListCreateView.as_view(), name='bot-list-create'),
    path('<uuid:pk>/', BotSessionDetailView.as_view(), name='bot-detail'),
    path('<uuid:pk>/send-summary/', send_summary_email_view, name='bot-send-summary'),
]
