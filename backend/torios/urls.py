from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse


def health(request):
    return JsonResponse({'status': 'ok', 'service': 'ToriOS API'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/health/', health),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/meetings/', include('apps.meetings.urls')),
    path('api/transcription/', include('apps.transcription.urls')),
    path('api/ai/', include('apps.ai_intelligence.urls')),
    path('api/bots/', include('apps.bots.urls')),
]
