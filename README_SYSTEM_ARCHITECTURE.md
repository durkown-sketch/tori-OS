# ToriOS - System Architecture & Requirements

## Table of Contents

- [Executive Summary](#executive-summary)
- [Functional Requirements](#functional-requirements)
- [Non-Functional Requirements](#non-functional-requirements)
- [System Architecture](#system-architecture)
- [Data Model](#data-model)
- [API Architecture](#api-architecture)
- [Processing Pipeline](#processing-pipeline)
- [Security Architecture](#security-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Integration Points](#integration-points)
- [Technology Stack Summary](#technology-stack-summary)

## Executive Summary

**ToriOS** is an AI-powered Meeting Intelligence Platform designed to transform spoken conversations into searchable knowledge, actionable insights, and automated follow-ups. The system captures meeting audio, transcribes it using speech-to-text technology, analyzes content with Large Language Models, and presents structured insights through a web interface.

### Core Value Proposition
- **Automated Transcription**: Convert meeting recordings to accurate, timestamped transcripts
- **AI-Powered Insights**: Generate executive summaries, key points, decisions, and action items
- **Searchable Knowledge Base**: Make meeting content discoverable and reusable
- **Workflow Automation**: Email summaries to participants and track action items
- **Bot Integration**: Support for bot-joined meetings (Google Meet, Zoom)

## Functional Requirements

### FR-1: User Authentication & Management
- **FR-1.1**: Users can register with email, password, and full name
- **FR-1.2**: Users can login/logout with JWT-based authentication
- **FR-1.3**: Users can refresh access tokens
- **FR-1.4**: Users can view and update their profile (full name, avatar, organization)
- **FR-1.5**: System maintains secure user sessions

### FR-2: Meeting Management
- **FR-2.1**: Users can create meeting records with title and description
- **FR-2.2**: Users can upload audio files (MP3, MP4, WAV, M4A, OGG, WebM, FLAC, MPEG)
- **FR-2.3**: System validates file type and size (max 200MB)
- **FR-2.4**: Users can view list of all their meetings with status
- **FR-2.5**: Users can search meetings by title or transcript content
- **FR-2.6**: Users can filter meetings by processing status
- **FR-2.7**: Users can view detailed meeting information
- **FR-2.8**: Users can update meeting title and description
- **FR-2.9**: Users can delete meetings (with associated files)

### FR-3: Audio Processing & Transcription
- **FR-3.1**: System uploads audio files to secure cloud storage (Supabase)
- **FR-3.2**: System transcribes audio using OpenAI Whisper API
- **FR-3.3**: Transcription produces full text with timestamped segments
- **FR-3.4**: System detects and stores language information
- **FR-3.5**: System tracks word count
- **FR-3.6**: Processing runs asynchronously without blocking UI
- **FR-3.7**: Users can track processing status in real-time

### FR-4: AI-Powered Insights Generation
- **FR-4.1**: System generates insights from transcripts using configurable AI providers (Gemini/NVIDIA)
- **FR-4.2**: Insights include executive summary (3-5 sentences)
- **FR-4.3**: Insights include detailed notes
- **FR-4.4**: Insights extract key discussion points
- **FR-4.5**: Insights identify decisions made
- **FR-4.6**: Insights extract action items with task, owner, deadline, and priority
- **FR-4.7**: Insights identify unresolved questions
- **FR-4.8**: Insights extract relevant topics/keywords
- **FR-4.9**: Users can regenerate insights if needed
- **FR-4.10**: System only reports explicitly stated information (no hallucination)

### FR-5: Transcript & Insights Viewing
- **FR-5.1**: Users can view full transcript with search functionality
- **FR-5.2**: Users can view timestamped transcript segments
- **FR-5.3**: Users can copy transcript text
- **FR-5.4**: Users can play meeting audio with built-in player
- **FR-5.5**: Users can view all AI-generated insights in organized tabs
- **FR-5.6**: Users can view action items with priority indicators
- **FR-5.7**: Users can track action items

### FR-6: Meeting Bots
- **FR-6.1**: Users can schedule bots to join Google Meet or Zoom meetings
- **FR-6.2**: Users can configure bot session details (title, URL, platform, schedule)
- **FR-6.3**: Users can manage bot session status
- **FR-6.4**: Bot sessions can be linked to resulting meeting records
- **FR-6.5**: Users can cancel or update bot sessions

### FR-7: Email Summaries
- **FR-7.1**: System can send HTML-formatted meeting summary emails
- **FR-7.2**: Users can configure recipients (organizer, participants, custom emails)
- **FR-7.3**: Emails include executive summary, key points, decisions, and action items
- **FR-7.4**: Users can manually trigger summary email sending
- **FR-7.5**: System tracks whether summary has been sent

### FR-8: Dashboard & Analytics
- **FR-8.1**: Users see dashboard with meeting statistics
- **FR-8.2**: Statistics show total, completed, pending, and failed meetings
- **FR-8.3**: Users see recent meetings list
- **FR-8.4**: Dashboard auto-refreshes for processing meetings

### FR-9: Error Handling & Recovery
- **FR-9.1**: System displays clear error messages on failure
- **FR-9.2**: Users can retry failed processing
- **FR-9.3**: System tracks processing attempts
- **FR-9.4**: System logs errors for debugging

## Non-Functional Requirements

### NFR-1: Performance
- **NFR-1.1**: API responses should be under 500ms for standard CRUD operations
- **NFR-1.2**: File uploads support up to 200MB
- **NFR-1.3**: Frontend loads with code splitting and lazy loading
- **NFR-1.4**: Background processing prevents UI blocking
- **NFR-1.5**: Dashboard auto-refreshes every 6-8 seconds for processing items only
- **NFR-1.6**: Token refresh handled seamlessly without user interruption

### NFR-2: Scalability
- **NFR-2.1**: Stateless API design using JWT authentication
- **NFR-2.2**: Background processing using threads (extensible to Celery/Redis)
- **NFR-2.3**: Cloud storage for audio files (Supabase)
- **NFR-2.4**: Database agnostic design (PostgreSQL/SQLite)
- **NFR-2.5**: Horizontal scaling ready via containerization

### NFR-3: Security
- **NFR-3.1**: All passwords hashed using Django's authentication system
- **NFR-3.2**: JWT tokens with secure transmission (Bearer tokens)
- **NFR-3.3**: CORS restricted to configured origins
- **NFR-3.4**: File type validation on upload
- **NFR-3.5**: File size limits enforced
- **NFR-3.6**: User data isolation (users only access their own resources)
- **NFR-3.7**: SQL injection protection via ORM
- **NFR-3.8**: CSRF protection enabled
- **NFR-3.9**: Secure headers via Django middleware
- **NFR-3.10**: API keys stored in environment variables

### NFR-4: Reliability
- **NFR-4.1**: Graceful error handling throughout
- **NFR-4.2**: Processing failures don't crash the system
- **NFR-4.3**: Retry mechanism for failed processing
- **NFR-4.4**: Transaction safety in database operations
- **NFR-4.5**: Temp file cleanup after transcription

### NFR-5: Usability
- **NFR-5.1**: Responsive design for mobile and desktop
- **NFR-5.2**: Clear status indicators for processing
- **NFR-5.3**: Intuitive navigation
- **NFR-5.4**: Real-time feedback via toast notifications
- **NFR-5.5**: Loading states for async operations
- **NFR-5.6**: Empty states with helpful guidance

### NFR-6: Maintainability
- **NFR-6.1**: Modular architecture with clear separation of concerns
- **NFR-6.2**: Service layer pattern for business logic
- **NFR-6.3**: TypeScript for type safety on frontend
- **NFR-6.4**: RESTful API design
- **NFR-6.5**: Comprehensive code organization
- **NFR-6.6**: Environment-based configuration

### NFR-7: Compatibility
- **NFR-7.1**: Modern browser support (ES2020+)
- **NFR-7.2**: REST API accessible from any HTTP client
- **NFR-7.3**: Cross-platform backend (Python/Django)

## System Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   React SPA     │         │   Django REST   │         │  External APIs  │
│   (Frontend)    │◄───────►│   (Backend)     │◄───────►│  & Services     │
│   Vite/TS/Tailwind│  HTTP/JSON/JWT │  DRF            │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                      │                           │
                                      │                           ├── OpenAI Whisper
                                      │                           ├── Google Gemini
                                      │                           ├── NVIDIA NIM
                                      │                           └── Supabase
                                      │
                                      ▼
                              ┌─────────────────┐
                              │   PostgreSQL    │
                              │   (Database)    │
                              └─────────────────┘
```

### Component Architecture

#### Frontend Layer
- **Presentation**: React components (pages, layouts)
- **State Management**: React Context API (Auth, Toast)
- **API Client**: Axios with interceptors
- **Routing**: React Router v7
- **Styling**: Tailwind CSS v4

#### Backend Layer
- **API Layer**: Django REST Framework views/serializers
- **Business Logic**: Service classes
- **Data Access**: Django ORM
- **Background Processing**: Threading (async pipeline)
- **Authentication**: JWT tokens

#### External Services
- **Storage**: Supabase Object Storage
- **Transcription**: OpenAI Whisper API
- **AI/LLM**: Google Gemini or NVIDIA NIM
- **Email**: SMTP or Console backend

### Architectural Patterns

- **Client-Server Architecture**: Separation of frontend and backend
- **RESTful API**: Resource-based endpoints
- **Service Layer Pattern**: Business logic isolated in services
- **Provider Pattern**: Pluggable AI providers
- **Repository Pattern**: ORM abstracts data access
- **Interceptor Pattern**: Axios interceptors for auth/refresh
- **Context Pattern**: React Context for global state

## Data Model

### Entity Relationship Diagram

```
User (1) ────< (N) Meeting
                │
                ├───(1) MeetingTranscript
                ├───(1) MeetingInsights
                └───(1) BotSession (optional)

BotSession (N) ────(1) User
BotSession (1) ────(1) Meeting (optional)
```

### Detailed Schema

#### users
```sql
id (UUID, PK)
email (VARCHAR, UNIQUE)
password (VARCHAR, hashed)
full_name (VARCHAR)
avatar_url (VARCHAR)
organization (VARCHAR)
is_active (BOOLEAN)
is_staff (BOOLEAN)
last_login (TIMESTAMP)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### meetings
```sql
id (UUID, PK)
user_id (UUID, FK -> users.id)
title (VARCHAR(500))
description (TEXT)
audio_file_path (VARCHAR(1000))
audio_file_name (VARCHAR(500))
audio_file_size (BIGINT)
audio_duration_seconds (INT)
audio_url (VARCHAR(2000))
status (VARCHAR(30)) -- uploaded/queued/transcribing/generating/completed/failed
error_message (TEXT)
processing_attempts (INT)
recorded_at (TIMESTAMP)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### meeting_transcripts
```sql
id (UUID, PK)
meeting_id (UUID, FK -> meetings.id, UNIQUE)
full_text (TEXT)
language (VARCHAR(20))
provider (VARCHAR(50))
segments (JSONB) -- [{id, start, end, text}]
word_count (INT)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### meeting_insights
```sql
id (UUID, PK)
meeting_id (UUID, FK -> meetings.id, UNIQUE)
executive_summary (TEXT)
detailed_notes (TEXT)
key_points (JSONB) -- [string]
decisions (JSONB) -- [string]
action_items (JSONB) -- [{task, owner, deadline, priority}]
unresolved_questions (JSONB) -- [string]
topics (JSONB) -- [string]
provider (VARCHAR(50))
model_used (VARCHAR(100))
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

#### bot_sessions
```sql
id (UUID, PK)
user_id (UUID, FK -> users.id)
meeting_id (UUID, FK -> meetings.id, NULL)
meeting_title (VARCHAR(500))
platform (VARCHAR(20)) -- google_meet/zoom
meeting_url (VARCHAR(1000)
scheduled_at (TIMESTAMP)
started_at (TIMESTAMP)
ended_at (TIMESTAMP)
status (VARCHAR(20)) -- scheduled/joining/active/completed/failed/cancelled
error_message (TEXT)
send_to_organizer (BOOLEAN)
send_to_participants (BOOLEAN)
participants_email_override (TEXT)
summary_sent (BOOLEAN)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

## API Architecture

### Authentication Flow

```
1. User registers/logs in → POST /api/auth/register or /api/auth/login
2. Server returns {user, access, refresh}
3. Client stores tokens in localStorage
4. Client attaches access token to requests: Authorization: Bearer <token>
5. On 401, client uses refresh token to get new access token
6. On logout, client blacklists refresh token
```

### Request/Response Patterns

- **Content-Type**: `application/json` for most requests, `multipart/form-data` for file uploads
- **Pagination**: PageNumberPagination with page size 20
- **Error Format**: `{detail: "..."} or {field: ["errors"]}`
- **Success Codes**: 200, 201, 202
- **Error Codes**: 400, 401, 403, 404, 409, 500

### API Versioning
Currently no versioning (v1 implicit). Structure allows easy addition of versioning if needed.

## Processing Pipeline

### State Machine

```
uploaded → queued → transcribing → generating → completed
                ↓                ↓
               failed           failed
```

### Pipeline Execution

```python
# Background thread execution
1. Meeting.objects.get(id=meeting_id)
2. Update status to TRANSCRIBING
3. transcript_text, segments, language = TranscriptionService.transcribe(meeting)
   - Download from Supabase
   - Call OpenAI Whisper
4. Create/update MeetingTranscript
5. Update status to GENERATING
6. insights_data = AIIntelligenceService.generate_insights(transcript_text)
   - Select provider (Gemini/NVIDIA)
   - Build prompt with schema
   - Call API
   - Parse and validate JSON
7. Create/update MeetingInsights
8. Update status to COMPLETED, clear error_message
```

### Error Recovery
- On exception, set status to FAILED
- Store error_message
- Increment processing_attempts
- Allow retry via POST /api/meetings/<id>/retry/

## Security Architecture

### Authentication & Authorization
- **JWT Tokens**: Stateless authentication
- **Token Lifetimes**: Access (60 min), Refresh (7 days)
- **Token Rotation**: Refresh tokens rotated on use
- **User Scoping**: All queries filtered by `request.user`

### Data Protection
- **Password Storage**: Django's PBKDF2 password hasher
- **File Storage**: Private buckets with signed URLs (1 hour expiry)
- **API Keys**: Environment variables only
- **CORS**: Whitelist of allowed origins

### Input Validation
- **File Upload**: Extension whitelist, size limit
- **API Input**: DRF serializers validate all data
- **SQL Injection**: Protected by ORM parameterization
- **XSS**: React escapes by default, Django templates safe

### Network Security
- **HTTPS**: Enforced in production
- **Security Headers**: Django security middleware
- **Rate Limiting**: Not currently implemented (recommended for production)

## Deployment Architecture

### Development Environment
```
Frontend: localhost:5173 (Vite dev server)
Backend:  localhost:8000 (Django runserver)
Database: SQLite (local)
Storage:  Supabase (cloud)
APIs:     External cloud APIs
```

### Production Environment

#### Frontend (Vercel)
- Static site deployment
- Build: `npm run build`
- Environment: `VITE_API_BASE_URL` pointing to backend
- CDN distribution

#### Backend (Render)
- Python web service
- Build: `pip install -r requirements.txt`
- Start: `gunicorn torios.wsgi:application`
- Environment variables for all config
- Migrations run via shell or release command

#### Database (Supabase PostgreSQL)
- Managed PostgreSQL
- Connection via `DATABASE_URL`
- Automatic backups

#### Storage (Supabase Storage)
- Object storage for audio files
- Bucket: `recordings`
- Signed URLs for access

### Deployment Flow
1. Code pushed to repository
2. Vercel builds and deploys frontend
3. Render builds and deploys backend
4. Migrations applied
5. Environment variables configured

## Integration Points

### External APIs

| Service | Purpose | Authentication | Rate Limits |
|---|---|---|---|
| OpenAI Whisper | Speech-to-text transcription | API Key | Per OpenAI plan |
| Google Gemini | AI insights generation | API Key | Per Google AI plan |
| NVIDIA NIM | Alternative AI provider | API Key | Per NVIDIA plan |
| Supabase | Storage & Database | Service Role Key / Anon Key | Per Supabase plan |

### Internal Integrations
- Frontend ↔ Backend: REST API over HTTP/JSON
- Backend ↔ Database: Django ORM
- Backend ↔ Supabase Storage: Supabase Python client
- Backend ↔ AI APIs: HTTP requests via clients
- Email: Django email backend

## Technology Stack Summary

### Frontend Stack
| Layer | Technology | Purpose |
|---|---|---|
| Framework | React 19 | UI library |
| Language | TypeScript 6 | Type safety |
| Build Tool | Vite 8 | Development & bundling |
| Routing | React Router 7 | Navigation |
| Styling | Tailwind CSS 4 | Styling |
| HTTP Client | Axios | API communication |
| Icons | Lucide React | UI icons |
| Linting | oxlint | Code quality |

### Backend Stack
| Layer | Technology | Purpose |
|---|---|---|
| Framework | Django 6.1 | Web framework |
| API | Django REST Framework 3.16 | REST API |
| Auth | SimpleJWT 5.5 | JWT authentication |
| Language | Python 3.x | Backend logic |
| Database ORM | Django ORM | Data access |
| Server | Gunicorn | WSGI server |
| Static Files | Whitenoise | Static serving |

### Infrastructure Stack
| Component | Technology | Purpose |
|---|---|---|
| Database | PostgreSQL (Supabase) / SQLite | Data storage |
| Object Storage | Supabase Storage | Audio file storage |
| Frontend Hosting | Vercel | Static hosting |
| Backend Hosting | Render | API hosting |
| Transcription | OpenAI Whisper | Speech-to-text |
| AI | Google Gemini / NVIDIA NIM | Insights generation |

## Future Enhancements

### Planned Features
- **Real-time Collaboration**: Multi-user meeting sharing
- **Calendar Integration**: Google Calendar/Outlook sync
- **Advanced Search**: Full-text search with semantic capabilities
- **Action Item Tracking**: Status tracking and notifications
- **Mobile App**: Native mobile applications
- **Speaker Diarization**: Identify different speakers
- **Multi-language Support**: Support for multiple languages
- **Analytics Dashboard**: Usage metrics and insights
- **Webhook Support**: Integrate with external tools
- **Celery Integration**: Replace threading with proper task queue

### Technical Improvements
- **Caching**: Redis for performance
- **Rate Limiting**: API throttling
- **Testing**: Comprehensive test suite
- **CI/CD**: Automated deployment pipeline
- **Monitoring**: Error tracking and performance monitoring
- **API Versioning**: Versioned API endpoints
- **WebSocket**: Real-time status updates

## Conclusion

ToriOS is a well-architected, scalable AI Meeting Intelligence Platform that follows modern software engineering practices. The system successfully integrates multiple external services (transcription, AI, storage) while maintaining clean separation of concerns. With its modular design, provider-agnostic AI integration, and comprehensive feature set, the platform is ready for production deployment and future enhancements.

---

**Document Version**: 1.0  
**Last Updated**: October 2026  
**Maintained By**: ToriOS Development Team
