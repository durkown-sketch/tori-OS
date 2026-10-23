# ToriOS Backend

## Overview

ToriOS Backend is a Django REST API that powers the AI Meeting Intelligence Platform. It handles user authentication, meeting management, audio transcription via Whisper, AI-powered insight generation, bot session management, and email delivery of meeting summaries.

## Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| [Python](https://www.python.org/) | 3.x | Programming language |
| [Django](https://www.djangoproject.com/) | >=6.1 | Web framework |
| [Django REST Framework](https://www.django-rest-framework.org/) | >=3.16 | REST API framework |
| [djangorestframework-simplejwt](https://django-rest-framework-simplejwt.readthedocs.io/) | >=5.5 | JWT authentication |
| [django-cors-headers](https://github.com/adamchainz/django-cors-headers) | >=4.6 | CORS handling |
| [PostgreSQL](https://www.postgresql.org/) | - | Primary database (via Supabase) |
| [SQLite](https://www.sqlite.org/) | - | Development fallback |
| [Supabase](https://supabase.com/) | >=2.10 | Storage for audio files |
| [OpenAI](https://openai.com/) | >=1.50 | Whisper API for transcription |
| [Google Generative AI](https://ai.google.dev/) | >=0.8 | Gemini API for insights |
| [Whitenoise](https://whitenoise.readthedocs.io/) | >=6.8 | Static file serving |
| [Gunicorn](https://gunicorn.org/) | >=23.0 | WSGI server |

## Project Structure

```
backend/
├── apps/
│   ├── accounts/          # User authentication and management
│   │   ├── migrations/
│   │   ├── models.py      # Custom User model
│   │   ├── serializers.py # Auth serializers
│   │   ├── views.py       # Auth views (register, login, me)
│   │   ├── urls.py
│   │   └── admin.py
│   ├── meetings/          # Core meeting functionality
│   │   ├── migrations/
│   │   ├── models.py      # Meeting, Transcript, Insights models
│   │   ├── serializers.py # Meeting serializers
│   │   ├── views.py       # Meeting CRUD and pipeline logic
│   │   └── urls.py
│   ├── transcription/     # Transcription service
│   │   ├── service.py     # Whisper + Storage services
│   │   └── urls.py
│   ├── ai_intelligence/   # AI insights generation
│   │   ├── service.py     # Gemini/NVIDIA providers
│   │   └── urls.py
│   └── bots/              # Meeting bot sessions
│       ├── migrations/
│       ├── models.py      # BotSession model
│       ├── serializers.py
│       ├── views.py       # Bot CRUD and email sending
│       ├── email_service.py # Email template and sending
│       └── urls.py
├── torios/                # Project configuration
│   ├── settings.py        # Django settings
│   ├── urls.py            # Root URL configuration
│   ├── wsgi.py
│   └── asgi.py
├── manage.py
├── requirements.txt
└── Procfile               # Deployment configuration
```

## Architecture

### Database Models

#### User (`apps.accounts.models.User`)
Custom user model extending `AbstractBaseUser` and `PermissionsMixin`:
- **id**: UUID (primary key)
- **email**: EmailField (unique, used as USERNAME_FIELD)
- **full_name**: CharField
- **avatar_url**: URLField
- **organization**: CharField
- **is_active**, **is_staff**: Boolean fields
- Timestamps: `created_at`, `updated_at`

#### Meeting (`apps.meetings.models.Meeting`)
Core meeting entity:
- **id**: UUID (primary key)
- **user**: ForeignKey to User
- **title**, **description**: Meeting metadata
- **Audio fields**: `audio_file_path` (Supabase storage key), `audio_file_name`, `audio_file_size`, `audio_duration_seconds`, `audio_url`
- **Status**: Choice field - `uploaded`, `queued`, `transcribing`, `generating`, `completed`, `failed`
- **error_message**: TextField for failure details
- **processing_attempts**: Integer counter
- **Timestamps**: `recorded_at`, `created_at`, `updated_at`
- **Properties**: `has_transcript`, `has_insights`

#### MeetingTranscript (`apps.meetings.models.MeetingTranscript`)
OneToOne with Meeting:
- **full_text**: Complete transcript
- **segments**: JSON array of timestamped segments `[{id, start, end, text}]`
- **language**: Detected language
- **provider**: Transcription provider (e.g., 'whisper')
- **word_count**: Integer

#### MeetingInsights (`apps.meetings.models.MeetingInsights`)
OneToOne with Meeting, AI-generated structured insights:
- **executive_summary**: Concise overview
- **detailed_notes**: Comprehensive notes
- **key_points**: JSON array of strings
- **decisions**: JSON array of strings
- **action_items**: JSON array of objects `[{task, owner, deadline, priority}]`
- **unresolved_questions**: JSON array of strings
- **topics**: JSON array of keywords
- **provider**, **model_used**: AI metadata

#### BotSession (`apps.bots.models.BotSession`)
Bot-joined meeting sessions:
- **user**: ForeignKey to User
- **meeting_title**, **platform** (`google_meet` | `zoom`), **meeting_url**
- **Scheduling**: `scheduled_at`, `started_at`, `ended_at`
- **Status**: `scheduled`, `joining`, `active`, `completed`, `failed`, `cancelled`
- **Email settings**: `send_to_organizer`, `send_to_participants`, `participants_email_override`, `summary_sent`
- **meeting**: OneToOne to Meeting (optional)

### API Endpoints

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/health/` | GET | No | Health check |
| `/api/auth/register/` | POST | No | User registration |
| `/api/auth/login/` | POST | No | User login (returns user + tokens) |
| `/api/auth/logout/` | POST | No | Logout (blacklists refresh token) |
| `/api/auth/token/refresh/` | POST | No | Refresh access token |
| `/api/auth/me/` | GET/PATCH | Yes | Get/update current user profile |
| `/api/meetings/` | GET/POST | Yes | List/create meetings |
| `/api/meetings/stats/` | GET | Yes | Dashboard statistics |
| `/api/meetings/<id>/` | GET/PATCH/DELETE | Yes | Meeting detail operations |
| `/api/meetings/<id>/upload/` | POST | Yes | Upload audio file (multipart) |
| `/api/meetings/<id>/transcribe/` | POST | Yes | Start processing pipeline |
| `/api/meetings/<id>/status/` | GET | Yes | Get processing status |
| `/api/meetings/<id>/retry/` | POST | Yes | Retry failed processing |
| `/api/meetings/<id>/transcript/` | GET | Yes | Get transcript |
| `/api/meetings/<id>/insights/` | GET | Yes | Get AI insights |
| `/api/meetings/<id>/regenerate-insights/` | POST | Yes | Regenerate insights |
| `/api/meetings/<id>/audio-url/` | GET | Yes | Get signed audio URL |
| `/api/bots/` | GET/POST | Yes | List/create bot sessions |
| `/api/bots/<id>/` | GET/PATCH/DELETE | Yes | Bot session detail |
| `/api/bots/<id>/send-summary/` | POST | Yes | Manually send summary email |

### Processing Pipeline

The meeting processing pipeline runs asynchronously in a background thread:

1. **Upload** (`POST /meetings/<id>/upload/`): File uploaded to Supabase Storage, meeting status set to `queued`
2. **Transcribe** (`POST /meetings/<id>/transcribe/`): Pipeline starts
   - Status → `transcribing`
   - Download audio from Supabase to temp file
   - Send to OpenAI Whisper API (`response_format=verbose_json`, segment timestamps)
   - Save `MeetingTranscript` with segments
3. **Generate Insights**: Status → `generating`
   - Send transcript to AI provider (Gemini or NVIDIA)
   - Parse JSON response matching schema
   - Save `MeetingInsights`
4. **Complete**: Status → `completed` (or `failed` with error message on exception)

### Services Layer

#### StorageService (`apps.transcription.service.StorageService`)
- `upload_file(file_obj, user_id)`: Upload to Supabase Storage, return (storage_path, signed_url)
- `get_signed_url(storage_path, expires_in)`: Generate signed URL
- `download_to_temp(storage_path)`: Download to local temp file
- `delete_file(storage_path)`: Remove from storage

#### TranscriptionService (`apps.transcription.service.TranscriptionService`)
- `transcribe(meeting)`: Orchestrates download + Whisper transcription, returns (full_text, segments, language)

#### AIIntelligenceService (`apps.ai_intelligence.service.AIIntelligenceService`)
Provider-agnostic service with factory pattern:
- **GeminiProvider**: Uses `google.generativeai` with Gemini model
- **NvidiaProvider**: Uses OpenAI client with NVIDIA NIM base URL
- **generate_insights(transcript)**: Selects provider from settings, sends structured prompt, parses and validates JSON response

### Email Service (`apps.bots.email_service`)

Sends HTML-formatted meeting summary emails:
- `build_summary_html()`: Constructs HTML email with executive summary, key points, decisions, action items
- `send_meeting_summary_email()`: Sends via Django email backend
- `collect_recipient_emails()`: Gathers recipients from bot session config (organizer + override emails)

### Authentication

- **Custom User Model**: Email-based authentication (`USERNAME_FIELD = 'email'`)
- **JWT**: Access tokens (60 min default), refresh tokens (7 days default) with rotation
- **Permissions**: Default `IsAuthenticated` for most endpoints, `AllowAny` for auth endpoints
- **Password Validation**: Django's built-in validators

## Configuration

### Environment Variables

Key variables from `.env.example`:

```env
# Django
DJANGO_SECRET_KEY=
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DATABASE_URL=postgresql://...

# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=recordings

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173

# JWT
JWT_ACCESS_TOKEN_LIFETIME_MINUTES=60
JWT_REFRESH_TOKEN_LIFETIME_DAYS=7

# AI Providers
AI_PROVIDER=gemini  # or 'nvidia'
GEMINI_API_KEY=
GEMINI_MODEL=gemini-1.5-flash
NVIDIA_API_KEY=
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=meta/llama-3.1-70b-instruct

# Transcription
OPENAI_API_KEY=
WHISPER_MODEL=whisper-1

# Email
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=ToriOS <noreply@torios.ai>
```

### Settings Highlights

- **REST Framework**: JWT authentication, JSON rendering, pagination (20 items/page)
- **File Uploads**: 200MB limit for audio files, supports multiple formats (.mp3, .mp4, .wav, .m4a, .ogg, .webm, .flac, .mpeg)
- **Static Files**: Whitenoise with compressed manifest storage
- **Database**: Uses dj-database-url for PostgreSQL/Supabase, falls back to SQLite

## Development

### Setup

```bash
# Create virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env
# Fill in your values

# Run migrations
python manage.py migrate

# Create superuser (optional)
python manage.py createsuperuser

# Run development server
python manage.py runserver
```

Server runs on `http://localhost:8000`

### Database Migrations

Migrations are included for accounts, meetings, and bots apps. Run `python manage.py migrate` to apply.

## Deployment

### Render (Backend)
- Connect `backend/` directory
- Set all environment variables
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn torios.wsgi:application`
- Run migrations via Render shell: `python manage.py migrate`

### Production Considerations
- Set `DEBUG=False`
- Configure proper `ALLOWED_HOSTS`
- Use PostgreSQL/Supabase
- Set up email backend (SMTP) instead of console
- Ensure CORS origins are properly configured
- Secure all API keys

## Error Handling

- Pipeline errors are caught, logged, and stored in `Meeting.error_message`
- Meetings can be retried via `/retry/` endpoint (only for failed status)
- API returns appropriate HTTP status codes with error details
- Background threads use daemon mode

## Logging

Uses Python's logging module. Errors in pipeline and services are logged with stack traces.

## Security

- JWT tokens for stateless authentication
- CORS configured for specific origins
- File type and size validation
- User-scoped queries (users can only access their own data)
- Custom user model with email authentication
- Secure password validation
- HTTPS required in production (via deployment platform)
