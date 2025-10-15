# BH-Setlist-Manager - Quick Reference Guide

## What is This Application?

BH-Setlist-Manager is a web application for bands and music groups to manage their song library, create setlists for performances, and coordinate live shows with real-time synchronization.

## Core Concepts

### 1. Songs
Individual songs with metadata:
- Artist, Title, Key, Tempo
- Lyrics with rich text formatting
- Performance notes

### 2. Setlists
Organized collections for performances:
```
Setlist (e.g., "Summer Tour 2025")
  ├── Set 1 (Opening)
  │   ├── Song A
  │   ├── Song B
  │   └── Song C
  ├── Set 2 (Main Set)
  │   └── ...
  └── Encore
      └── ...
```

### 3. Song Collections
Reusable templates (e.g., "Acoustic Songs", "High Energy")
- Quick way to build setlists
- Can be shared publicly

### 4. Performance Mode
Real-time synchronized performance interface:
- **Leader**: Controls navigation, all followers see their screen
- **Follower**: Follows leader automatically
- **Standalone**: Individual practice mode

## Database Schema Quick View

### Main Tables
1. **users** - User accounts and permissions
2. **songs** - Song library
3. **setlists** - Performance setlists
4. **sets** - Sets within setlists
5. **set_songs** - Songs in sets (with ordering)
6. **song_collections** - Reusable song templates
7. **song_collection_songs** - Songs in collections
8. **performance_sessions** - Active performance sessions
9. **session_participants** - Followers in sessions
10. **leadership_requests** - Leadership transfer requests

### Key Relationships
- Users own Setlists and Collections
- Setlists contain Sets
- Sets contain Songs (via junction table)
- Collections contain Songs (via junction table)
- Performance Sessions reference Setlists and have a Leader

## User Roles

1. **Regular User (Level 1)**
   - Manage own songs, setlists, collections
   - View public content
   - Join performance sessions

2. **Admin (Level 3)**
   - All Regular User features
   - User management (create, edit, delete users)
   - Access to admin panel

## Main Features

### Song Management
- Create, edit, delete songs
- Search and filter
- Rich text lyrics editor
- Performance notes field

### Setlist Management
- Create setlists with multiple sets
- Drag-and-drop song ordering
- Add songs individually or from collections
- Duplicate detection
- Make setlists public
- Generate PDF for printing
- Duplicate entire setlists

### Performance Mode
- Real-time synchronization
- Leader/Follower roles
- Leadership transfer system
- Large text for stage visibility
- Touch gestures for navigation
- Offline caching

### Administration
- User invitation system
- Password reset
- User level management
- View all users and their activity

## Technology Stack

### Frontend
- React 18.3
- React Router 6.28
- Tailwind CSS
- Vite (build tool)
- Lucide React (icons)

### Backend
- Supabase PostgreSQL database
- Supabase Auth
- Supabase Realtime
- Supabase Edge Functions (serverless)

### Key Libraries
- jsPDF - PDF generation
- react-beautiful-dnd - Drag and drop
- Quill/React-Quill - Rich text editing
- Fuse.js - Fuzzy search

## API Structure

### Services Layer
- `songsService` - Song CRUD operations
- `setlistsService` - Setlist operations
- `setsService` - Set operations within setlists
- `songCollectionsService` - Collection operations
- `performanceService` - Performance mode & real-time sync
- `userService` - User management (admin)

### Edge Functions (Admin Only)
- `admin-invite-user` - Create/invite users
- `admin-list-users` - List all auth users
- `admin-delete-user` - Delete user accounts
- `admin-reset-password` - Password management

## Security Model

### Row Level Security (RLS)
- All tables protected with RLS policies
- Users can only modify their own data
- Public content readable by all authenticated users
- Admin actions verified at database and Edge Function level

### Authentication
- Email/Password
- Magic Link (passwordless)
- Google OAuth (configurable)
- JWT token-based sessions

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Format code
npm run format
```

## Environment Variables

Required:
- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## Deployment

### Docker (CapRover)
1. Build Docker image (Nginx + static files)
2. Deploy to CapRover
3. Set environment variables in CapRover dashboard
4. Container automatically injects runtime config

## Routes

### Public Routes
- `/login` - Login page
- `/auth/*` - Auth callback pages

### Protected Routes
- `/` - Dashboard
- `/songs` - Song library
- `/songs/:id` - Song details
- `/songs/:id/edit` - Edit song
- `/setlists` - Setlist management
- `/setlists/:id` - Setlist details
- `/setlists/:id/edit` - Edit setlist
- `/song-collections` - Collections
- `/performance` - Performance mode
- `/profile` - User profile
- `/admin/users` - User management (admin only)

## Common Workflows

### Creating a Complete Setlist
1. Go to Setlists → Create New
2. Enter setlist name
3. Click into setlist → Add Set
4. Enter set name (e.g., "Set 1")
5. Click "Add Songs" → Select from library
6. Drag to reorder songs
7. Repeat for additional sets
8. Mark as public if desired
9. Generate PDF for print

### Starting a Performance Session
1. Open setlist
2. Click "Performance Mode"
3. Choose "Lead"
4. Navigate with Next/Previous
5. Share session (others can "Follow")
6. End session when done

### Adding Songs from a Collection
1. Create a collection (Song Collections → New)
2. Add songs to collection
3. When editing a set, click "Add from Collection"
4. Select collection
5. System warns about duplicates
6. Songs added with proper ordering

## Performance Mode Details

### Leader Controls
- Navigate to next/previous song
- Jump to specific song
- See connected followers
- Approve leadership transfer requests
- End session

### Follower Experience
- Automatically syncs with leader
- Sees leader's current song
- Can request leadership
- Can leave session independently

### Features
- Real-time synchronization via WebSocket
- Caching for offline resilience
- 5-minute cache expiry
- Automatic cleanup of stale sessions (2 hours)
- Only one active session per setlist

## Mobile Support

- Fully responsive design
- Touch-friendly interfaces
- Swipe gestures in performance mode
- Capacitor ready for native apps
- Haptic feedback on supported devices

## Data Export

- PDF generation for setlists
- Includes all sets and songs
- Shows key, tempo, and artist info
- Formatted for printing

## Tips for AI Recreation

1. **Database First**: Create all migrations in order
2. **RLS is Critical**: Every table needs proper policies
3. **Services Layer**: Clean separation of concerns
4. **Real-time Complexity**: Performance mode requires WebSocket subscriptions
5. **Edge Functions**: Needed for admin operations bypassing RLS
6. **Caching Strategy**: Important for performance mode offline capability
7. **Mobile Gestures**: Enhance UX significantly
8. **Error Handling**: Comprehensive try-catch and user feedback

## File Structure

```
src/
├── pages/           # Page components (18 pages)
├── components/      # Reusable UI (17 components)
├── services/        # API layer (7 services)
├── context/         # React Context (2 providers)
├── utils/           # Utilities (error handling, PDF, etc.)
└── main.jsx         # Entry point with routing

supabase/
├── migrations/      # 18 database migrations
└── functions/       # 4 Edge Functions
```

## Key Constraints

- Unique song: (artist + title)
- Unique setlist: name per user
- Unique collection: name per user
- One active session per setlist
- Unique participant per session

## Performance Optimizations

- Lazy loading with React.lazy
- Code splitting by route
- Database indexes on common queries
- Partial indexes for filtered queries
- Optimized RLS policies
- localStorage caching
- Debounced search inputs

---

For complete details, see [APPLICATION_SPECIFICATION.md](./APPLICATION_SPECIFICATION.md)
