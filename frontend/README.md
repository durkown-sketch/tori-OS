# ToriOS Frontend

## Overview

ToriOS is a React-based frontend for an AI Meeting Intelligence Platform that transforms conversations into searchable knowledge, clear summaries, and actionable next steps. The frontend provides an intuitive interface for uploading meeting recordings, tracking processing status, viewing AI-generated insights, transcripts, and action items.

## Technology Stack

| Technology | Version | Purpose |
|---|---|---|
| [React](https://react.dev/) | 19.3.0 | UI library |
| [TypeScript](https://www.typescriptlang.org/) | ~6.0.2 | Type-safe development |
| [Vite](https://vitejs.dev/) | ^8.3.4 | Build tool and dev server |
| [React Router DOM](https://reactrouter.com/) | ^7.18.4 | Client-side routing |
| [Tailwind CSS](https://tailwindcss.com/) | ^4.3.3 | Utility-first CSS framework |
| [Axios](https://axios-http.com/) | ^1.20.0 | HTTP client |
| [Lucide React](https://lucide.dev/) | ^1.58.0 | Icon library |
| [oxlint](https://oxc.rs/) | ^1.87.0 | Linting |

## Project Structure

```
frontend/src/
├── api/                # API layer
│   ├── client.ts       # Axios instance with interceptors
│   └── services.ts     # API service functions
├── assets/             # Static assets
├── components/         # Reusable UI components
│   ├── AppLayout.tsx   # Main application layout with sidebar
│   └── ProtectedRoute.tsx # Route protection components
├── contexts/           # React Context providers
│   ├── AuthContext.tsx # Authentication state management
│   └── ToastContext.tsx# Toast notification system
├── pages/              # Route page components
│   ├── LandingPage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── DashboardPage.tsx
│   ├── MeetingsPage.tsx
│   ├── NewMeetingPage.tsx
│   ├── MeetingDetailPage.tsx
│   ├── BotsPage.tsx
│   ├── SearchPage.tsx
│   └── SettingsPage.tsx
├── types/              # TypeScript type definitions
│   └── index.ts
├── utils/              # Utility functions
│   ├── formatters.ts
│   └── helpers.ts
├── App.tsx             # Root component with routing
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Architecture

### Routing

The application uses React Router v7 with lazy-loaded routes for optimal performance:

- **Public Routes**: Landing, Login, Register (wrapped with `PublicOnlyRoute`)
- **Protected Routes**: Dashboard, Meetings, New Meeting, Meeting Detail, Bots, Search, Settings (wrapped with `ProtectedRoute`)
- **Fallback**: Redirects unknown routes to home

### State Management

- **AuthContext**: Manages user authentication state, tokens (stored in localStorage), login/register/logout operations, and session restoration
- **ToastContext**: Provides global toast notification system for user feedback

### API Communication

#### Axios Client (`api/client.ts`)
- Base URL configured via `VITE_API_BASE_URL` environment variable (defaults to `/api`)
- Request interceptor automatically attaches Bearer token from localStorage
- Response interceptor handles 401 errors with automatic token refresh
- Implements request queuing to handle concurrent requests during token refresh
- Normalizes API errors into a consistent format

#### Services (`api/services.ts`)
Provides typed API methods organized by domain:
- **authApi**: login, register, logout, refresh token, get/update profile
- **meetingsApi**: CRUD operations, file upload with progress tracking, status polling, transcript/insights retrieval, regeneration, retry processing, audio URL retrieval
- **statsApi**: Dashboard statistics

### Component Patterns

- **AppLayout**: Responsive layout with collapsible sidebar navigation, mobile menu, user profile section, and logout functionality
- **Lazy Loading**: All pages are lazy-loaded to reduce initial bundle size
- **Type Safety**: Comprehensive TypeScript interfaces for all data models
- **Polling**: Automatic status polling (6-8 second intervals) for meetings in processing states

## Key Features

- **Authentication**: JWT-based auth with automatic token refresh
- **Meeting Management**: Create, upload audio files, track processing status
- **AI Insights**: View executive summaries, key points, decisions, action items, and unresolved questions
- **Transcript Viewer**: Full transcript with timestamped segments and search functionality
- **Audio Player**: Built-in player for meeting recordings
- **Dashboard**: Overview statistics and recent meetings
- **Meeting Bots**: Interface for bot-joined meetings (Google Meet/Zoom)
- **Search**: Search across meetings and transcripts
- **Responsive Design**: Mobile-friendly interface with responsive layouts

## Environment Variables

Create a `.env` file in the frontend directory based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=ToriOS
```

## Development

### Prerequisites
- Node.js (compatible with Vite 8)
- npm or yarn

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Type check and build for production
npm run lint     # Run oxlint
npm run preview  # Preview production build
```

## Build Configuration

### Vite Config (`vite.config.ts`)
- React plugin with Fast Refresh
- Tailwind CSS v4 plugin
- Path alias `@` pointing to `./src`
- Dev server on port 5173 with API proxy to `http://127.0.0.1:8000`

### TypeScript Configuration
- Project references setup with `tsconfig.app.json`, `tsconfig.node.json`
- Strict type checking enabled

## Styling

- **Tailwind CSS v4**: Latest version with Vite plugin integration
- **Custom CSS**: Global styles in `index.css` and `App.css`
- **Component-based styling**: Inline styles used for complex components with design tokens
- **Design System**: Consistent color palette (navy, green, gold) used throughout the app

## Browser Support

Modern browsers supporting ES2020+ features.

## Deployment

The frontend is designed to be deployed on Vercel. Set `VITE_API_BASE_URL` to your backend URL (e.g., Render deployment).

## Notes

- All API calls require authentication except public routes
- Tokens are stored in localStorage and automatically refreshed
- File uploads use FormData with multipart/form-data content type
- Large audio files (up to 200MB) are supported
- Processing states trigger automatic polling for real-time updates
