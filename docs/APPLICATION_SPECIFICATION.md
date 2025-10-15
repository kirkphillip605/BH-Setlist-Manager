# BH-Setlist-Manager - Complete Application Specification

## Executive Summary

The BH-Setlist-Manager is a comprehensive web application designed for band/music group management, specifically focused on organizing songs, creating setlists, and managing live performances. Built with React (frontend) and Supabase (backend), it provides real-time collaboration features, user management, and a specialized performance mode for live shows.

**Technology Stack:**
- **Frontend:** React 18.3.1, React Router 6.28.0, Vite 7.0.5
- **Backend:** Supabase (PostgreSQL database + Edge Functions)
- **UI Libraries:** Tailwind CSS 3.4.15, Lucide React (icons)
- **Deployment:** Docker + Nginx (static build served via CapRover)
- **Additional Features:** PDF generation (jsPDF), Rich text editing (Quill/React-Quill), Drag-and-drop (react-beautiful-dnd), Fuzzy search (Fuse.js)

---

## Application Architecture

### 1. Frontend Architecture

#### Component Structure
```
src/
├── pages/              # Main page components
│   ├── Dashboard.jsx
│   ├── ManageSongs.jsx
│   ├── ManageSetlists.jsx
│   ├── ManageSongCollections.jsx
│   ├── PerformanceMode.jsx
│   ├── UserManagement.jsx
│   ├── Profile.jsx
│   ├── Login.jsx
│   └── auth/          # Authentication pages
├── components/        # Reusable UI components
├── services/          # API service layer
├── context/           # React context providers
├── utils/            # Utility functions
└── main.jsx          # Application entry point
```

#### Key Contexts
1. **AuthContext** - Manages user authentication state, login/logout, session management
2. **PageTitleContext** - Handles dynamic page title updates

#### Routing Structure
- `/` - Dashboard (home page)
- `/songs` - Song library management
- `/songs/new` - Create new song
- `/songs/:id` - View song details
- `/songs/:id/edit` - Edit song
- `/setlists` - Setlist management
- `/setlists/new` - Create new setlist
- `/setlists/:id` - View setlist details
- `/setlists/:id/edit` - Edit setlist
- `/setlists/:id/sets/new` - Create new set within setlist
- `/setlists/:setlistId/sets/:setId/edit` - Edit set
- `/song-collections` - Song collection management
- `/song-collections/new` - Create new collection
- `/song-collections/:id` - View collection details
- `/song-collections/:id/edit` - Edit collection
- `/performance` - Performance mode
- `/profile` - User profile
- `/edit-profile` - Edit user profile
- `/change-password` - Change password
- `/admin/users` - User management (admin only)
- `/login` - Login page
- `/auth/*` - Authentication callback pages

---

## Database Schema

### Core Tables

#### 1. `users` Table
Primary user information table.

**Columns:**
- `id` (uuid, PK) - User unique identifier (matches auth.users.id)
- `email` (text, unique, not null) - User email address
- `name` (text, not null) - User's full name
- `role` (text) - User's role in the band (e.g., "Lead Vocals", "Guitar")
- `user_level` (integer, default 1) - Access level (1=Regular, 2=Moderator, 3=Admin)
- `created_at` (timestamptz) - Account creation timestamp

**Indexes:**
- `idx_users_email` on email
- `idx_users_user_level` on user_level
- `idx_users_user_level_email` on (user_level, email)

**Row Level Security (RLS):**
- Users can read their own data
- Users can update their own data
- Admins (user_level=3) can read and manage all users

#### 2. `songs` Table
Central repository for all songs.

**Columns:**
- `id` (uuid, PK) - Song unique identifier
- `original_artist` (varchar(255), not null) - Original artist name
- `title` (varchar(255), not null) - Song title
- `key_signature` (varchar(16)) - Musical key (e.g., "C", "Am")
- `tempo` (integer) - Song tempo in BPM
- `lyrics` (text, default '') - Song lyrics
- `performance_note` (text, default '') - Special notes for performance
- `created_at` (timestamptz) - Creation timestamp

**Indexes:**
- `idx_songs_artist` on original_artist
- `idx_songs_title` on title
- `idx_songs_artist_title` on (original_artist, title)
- `idx_songs_performance_note` on performance_note (partial index where not null/empty)

**RLS:**
- All authenticated users can read, insert, update, and delete songs

**Constraints:**
- Unique constraint on (original_artist, title) enforced at application level

#### 3. `setlists` Table
Container for organizing sets for performances.

**Columns:**
- `id` (uuid, PK) - Setlist unique identifier
- `name` (varchar(255), not null) - Setlist name
- `user_id` (uuid, FK→users.id, not null) - Owner of the setlist
- `is_public` (boolean, default false) - Whether setlist is publicly visible
- `created_at` (timestamptz) - Creation timestamp

**Indexes:**
- `idx_setlists_user_id` on user_id
- `idx_setlists_name` on name
- `idx_setlists_public` on is_public (partial where is_public=true)
- `idx_setlists_user_public` on (user_id, is_public)

**RLS:**
- Users can read their own setlists OR public setlists
- Users can only manage (insert, update, delete) their own setlists
- Admins can manage all setlists

**Constraints:**
- ON DELETE CASCADE from users
- Application-level unique constraint on (name, user_id)

#### 4. `sets` Table
Individual sets within a setlist (e.g., "Set 1", "Set 2", "Encore").

**Columns:**
- `id` (uuid, PK) - Set unique identifier
- `setlist_id` (uuid, FK→setlists.id, not null) - Parent setlist
- `name` (text, not null) - Set name
- `set_order` (integer, not null, default 1) - Order within the setlist
- `created_at` (timestamptz) - Creation timestamp

**Indexes:**
- `idx_sets_setlist_id` on setlist_id
- `idx_sets_order` on (setlist_id, set_order)

**RLS:**
- Users can read sets in their own setlists OR public setlists
- Users can only manage sets in their own setlists
- Admins can manage all sets

**Constraints:**
- ON DELETE CASCADE from setlists

#### 5. `set_songs` Table
Junction table linking songs to sets with ordering.

**Columns:**
- `set_id` (uuid, FK→sets.id, not null) - Parent set
- `song_id` (uuid, FK→songs.id, not null) - Referenced song
- `song_order` (integer, not null, default 1) - Order within the set
- Primary Key: (set_id, song_id)

**Indexes:**
- `idx_set_songs_set_id` on set_id
- `idx_set_songs_song_id` on song_id
- `idx_set_songs_order` on (set_id, song_order)

**RLS:**
- Users can read songs in their own sets OR public setlist sets
- Users can only manage songs in their own sets

**Constraints:**
- ON DELETE CASCADE from both sets and songs

#### 6. `song_collections` Table
Reusable song groupings (formerly "set templates").

**Columns:**
- `id` (uuid, PK) - Collection unique identifier
- `name` (varchar(255), not null) - Collection name
- `user_id` (uuid, FK→users.id, not null) - Owner
- `is_public` (boolean, default false) - Public visibility
- `created_at` (timestamptz) - Creation timestamp

**Indexes:**
- `idx_song_collections_user_id` on user_id (renamed from set_templates)
- `idx_song_collections_name` on name
- `idx_song_collections_public` on is_public (partial)
- `idx_song_collections_user_public` on (user_id, is_public)

**RLS:**
- Users can read their own collections OR public collections
- Users can only manage their own collections

**Constraints:**
- ON DELETE CASCADE from users
- Application-level unique constraint on (name, user_id)

#### 7. `song_collection_songs` Table
Junction table for song collections.

**Columns:**
- `song_collection_id` (uuid, FK→song_collections.id, not null)
- `song_id` (uuid, FK→songs.id, not null)
- `song_order` (integer, not null, default 0)
- Primary Key: (song_collection_id, song_id)

**Indexes:**
- `idx_song_collection_songs_collection_id` on song_collection_id
- `idx_song_collection_songs_song_id` on song_id
- `idx_song_collection_songs_order` on (song_collection_id, song_order)

**RLS:**
- Users can read their own collection songs OR public collection songs
- Users can only manage songs in their own collections

**Constraints:**
- ON DELETE CASCADE from both song_collections and songs

#### 8. `performance_sessions` Table
Live performance session tracking with real-time synchronization.

**Columns:**
- `id` (uuid, PK) - Session unique identifier
- `setlist_id` (uuid, FK→setlists.id, not null) - Active setlist
- `leader_id` (uuid, FK→users.id, not null) - Session leader (who controls)
- `current_set_id` (uuid, FK→sets.id) - Currently active set
- `current_song_id` (uuid, FK→songs.id) - Currently active song
- `is_active` (boolean, default true) - Session active status
- `created_at` (timestamptz) - Session start time

**Indexes:**
- `idx_performance_sessions_setlist_id` on setlist_id
- `idx_performance_sessions_leader_id` on leader_id
- `idx_performance_sessions_active` on is_active (partial where is_active=true)
- `idx_performance_sessions_current_set` on current_set_id
- `idx_performance_sessions_current_song` on current_song_id
- `idx_performance_sessions_setlist_active` on (setlist_id, is_active) where is_active=true
- `idx_unique_active_session_per_setlist` UNIQUE on setlist_id where is_active=true

**RLS:**
- Users can read sessions for setlists they can access
- Leaders can manage their own sessions
- Any authenticated user can create a session (as leader)

**Constraints:**
- ON DELETE CASCADE from setlists and users
- ON DELETE SET NULL from sets and songs
- UNIQUE constraint ensures only one active session per setlist

**Business Logic:**
- Sessions older than 2 hours are automatically marked inactive
- Only one active session per setlist at a time

#### 9. `session_participants` Table
Tracks followers in a performance session.

**Columns:**
- `id` (uuid, PK) - Participant record identifier
- `session_id` (uuid, FK→performance_sessions.id, not null) - Parent session
- `user_id` (uuid, FK→users.id, not null) - Participant user
- `joined_at` (timestamptz, default now()) - Join timestamp
- `is_active` (boolean, default true) - Participant active status
- UNIQUE constraint on (session_id, user_id)

**Indexes:**
- `idx_session_participants_session_id` on session_id
- `idx_session_participants_user_id` on user_id
- `idx_session_participants_active` on is_active (partial where is_active=true)
- `idx_session_participants_session_active` on (session_id, is_active) where is_active=true

**RLS:**
- Users can read participants for sessions they can access
- Users can manage their own participation
- Leaders can manage all participants in their sessions

**Constraints:**
- ON DELETE CASCADE from both performance_sessions and users
- Unique constraint prevents duplicate participation

#### 10. `leadership_requests` Table
Manages leadership transfer requests in performance sessions.

**Columns:**
- `id` (uuid, PK) - Request unique identifier
- `session_id` (uuid, FK→performance_sessions.id, not null) - Target session
- `requesting_user_id` (uuid, FK→users.id, not null) - Requesting user
- `requesting_user_name` (text, not null) - User name (for display)
- `status` (text, not null, default 'pending') - Status: 'pending', 'approved', 'rejected', 'expired'
- `expires_at` (timestamptz, not null) - Request expiration time
- `responded_at` (timestamptz) - Response timestamp
- `created_at` (timestamptz) - Request creation time

**Indexes:**
- `idx_leadership_requests_session_id` on session_id
- `idx_leadership_requests_requesting_user_id` on requesting_user_id
- `idx_leadership_requests_status` on status
- `idx_leadership_requests_expires_at` on expires_at
- `idx_leadership_requests_session_pending` on (session_id, status) where status='pending'

**RLS:**
- Users can read their own requests
- Leaders can read all requests for their sessions
- Users can insert their own requests
- Leaders can update requests for their sessions

**Constraints:**
- ON DELETE CASCADE from both performance_sessions and users

**Business Logic:**
- Pending requests that expire are automatically marked as 'expired'

### Database Functions

#### 1. `handle_new_user()`
**Purpose:** Automatically creates a user profile in public.users when a new auth user is created.

**Trigger:** AFTER INSERT on auth.users

**Logic:**
- Extracts user data from auth.users
- Creates corresponding record in public.users
- Sets default user_level to 1
- Uses email or metadata for name field

#### 2. `sync_user_profile(user_id, user_name, user_email, user_role, user_level)`
**Purpose:** Synchronizes user profile data between auth.users and public.users.

**Parameters:**
- `user_id` (uuid) - User to sync
- `user_name` (text) - Updated name
- `user_email` (text) - Updated email
- `user_role` (text) - Updated role
- `user_level` (integer) - Updated user level

**Logic:**
- Updates existing user record
- Creates user if doesn't exist
- Uses COALESCE to preserve existing values when nulls are passed

#### 3. `cleanup_stale_performance_sessions()`
**Purpose:** Cleans up inactive and expired performance sessions.

**Logic:**
- Marks sessions older than 2 hours as inactive
- Marks participants in inactive sessions as inactive
- Marks expired leadership requests as 'expired'

#### 4. `cleanup_expired_leadership_requests()`
**Purpose:** Marks expired pending leadership requests.

**Logic:**
- Updates status to 'expired' for pending requests past expires_at

#### 5. `cleanup_inactive_sessions()`
**Purpose:** Comprehensive session cleanup wrapper.

**Logic:**
- Calls cleanup_stale_performance_sessions()
- Calls cleanup_expired_leadership_requests()

#### 6. `is_leader_active(leader_uuid, session_uuid)`
**Purpose:** Checks if a session leader is still actively participating.

**Returns:** boolean

**Logic:**
- Checks if leader is in session_participants with recent activity (within 10 minutes)
- Falls back to session age check (session < 10 minutes old)

#### 7. `ensure_single_active_session(setlist_uuid, new_leader_uuid)`
**Purpose:** Ensures only one active session exists per setlist.

**Returns:** uuid (existing session id) or NULL (can create new)

**Logic:**
- Finds existing active session for setlist
- Checks if existing leader is still active
- Allows session reuse if leader is inactive or same user
- Returns existing session id if active leader exists

#### 8. `get_active_session_with_leader(setlist_uuid)`
**Purpose:** Retrieves active session with leader information.

**Returns:** Table with session and leader details

**Logic:**
- Joins performance_sessions with users
- Returns most recent active session for given setlist

---

## Application Features

### 1. User Management & Authentication

#### Authentication Methods
- **Email/Password:** Standard authentication
- **Magic Link:** Passwordless login via email
- **Google OAuth:** Social login (configured but may need setup)
- **Password Reset:** Email-based password recovery

#### User Levels
1. **Regular User (Level 1):**
   - Manage own songs, setlists, and collections
   - Read public setlists and collections
   - Participate in performance sessions
   - View own profile

2. **Moderator (Level 2):**
   - Same as Regular User (no additional permissions shown in current implementation)

3. **Admin (Level 3):**
   - All Regular User permissions
   - Access User Management page
   - Create/invite new users
   - Delete users
   - Reset user passwords
   - Change user levels and roles
   - Manage all users in the system

#### User Profile Management
- View profile (name, email, role, user level)
- Edit profile (name, role)
- Change password
- Profile is automatically created on first login via database trigger

### 2. Song Management

#### Song CRUD Operations
**Create Song:**
- Required fields: Original Artist, Title
- Optional fields: Key Signature, Tempo (BPM), Lyrics, Performance Note
- Duplicate detection: Prevents duplicate (artist + title) combinations
- Rich text editor for lyrics

**Read Song:**
- List view with search and filtering
- Detail view showing all song information
- Lyrics displayed with formatting

**Update Song:**
- Edit all song fields
- Duplicate checking (excluding current song)
- Validation for tempo (must be numeric)

**Delete Song:**
- Cascade deletes from all sets and collections
- Confirmation required

#### Song Features
- **Search:** Fuzzy search by artist or title (using Fuse.js)
- **Sorting:** By artist, title, or creation date
- **Filtering:** Can filter by various criteria
- **Performance Notes:** Special notes visible in performance mode

### 3. Setlist Management

#### Setlist Structure
```
Setlist
  ├── Set 1
  │   ├── Song 1
  │   ├── Song 2
  │   └── Song 3
  ├── Set 2
  │   └── ...
  └── Encore
      └── ...
```

#### Setlist CRUD Operations
**Create Setlist:**
- Required: Name
- Optional: is_public flag
- Automatically associates with current user
- Can create empty or with initial sets

**Read Setlist:**
- List view showing all user's setlists plus public setlists
- Detail view showing all sets and songs in order
- Set-level organization

**Update Setlist:**
- Change name
- Toggle public/private visibility
- Add/remove/reorder sets

**Delete Setlist:**
- Cascade deletes all sets and set_songs associations
- Confirmation required

#### Set Management
**Create Set:**
- Within a setlist context
- Required: Set name
- Automatic ordering (set_order)
- Can add songs immediately or later

**Read Set:**
- View set details with all songs
- Songs displayed in order (song_order)

**Update Set:**
- Change set name
- Add/remove songs
- Reorder songs via drag-and-drop
- Move songs between sets

**Delete Set:**
- Removes set and all song associations
- Confirmation required

#### Song Selection & Management
- **Add Individual Songs:** Select from song library
- **Add from Collection:** Import songs from saved collections
- **Duplicate Detection:** Warns when adding songs already in the setlist
- **Drag-and-Drop Reordering:** Both desktop and mobile support
- **Move Songs Between Sets:** Transfer songs from one set to another
- **Remove Songs:** Remove individual songs from sets

#### Advanced Features
- **Duplicate Setlist:** Clone entire setlist with all sets and songs
- **Public Sharing:** Make setlist visible to all users
- **PDF Export:** Generate printable setlist for performances
- **Performance Mode:** Launch real-time performance session

### 4. Song Collections (Templates)

#### Purpose
Reusable groupings of songs for common scenarios (e.g., "Acoustic Set", "High Energy Songs", "Ballads").

#### Collection CRUD Operations
**Create Collection:**
- Required: Name
- Optional: Songs, is_public flag
- Add songs from library with ordering

**Read Collection:**
- List view of all collections (own + public)
- Detail view showing all songs in order

**Update Collection:**
- Change name
- Toggle public/private
- Add/remove/reorder songs

**Delete Collection:**
- Removes collection but not the songs themselves
- Confirmation required

#### Collection Features
- **Quick Add to Set:** Import all songs from a collection into a set at once
- **Duplicate Detection:** Warns about songs already in target setlist
- **Public Sharing:** Share collections with other users
- **Reordering:** Drag-and-drop song ordering

### 5. Performance Mode

#### Overview
A specialized real-time interface for live performances with leader-follower synchronization.

#### Modes
1. **Leader Mode:**
   - Controls the session
   - Navigates through songs
   - All followers see leader's current position
   - Can see connected followers
   - Can end session for all

2. **Follower Mode:**
   - Follows leader's navigation automatically
   - Sees leader's current song/set
   - Can request leadership
   - Read-only experience
   - Can leave session independently

3. **Standalone Mode:**
   - Local-only, no synchronization
   - Full navigation control
   - No network requirements
   - Uses localStorage caching

#### Session Management
**Creating a Session:**
- Select a setlist
- Choose role (Leader/Follower)
- System checks for existing active sessions
- Only one active session per setlist at a time

**Session Features:**
- Real-time synchronization via Supabase Realtime
- Automatic reconnection on network issues
- Session timeout after 2 hours of inactivity
- Automatic cleanup of stale sessions

#### Leadership Transfer
- Followers can request leadership
- Leader receives notification
- Leader can approve/reject
- Request expires after timeout
- Automatic leadership on leader disconnect

#### Navigation Controls
- Next/Previous song
- Jump to specific song
- Set navigation
- Progress tracking (e.g., "Song 3 of 12")
- Current set indicator

#### Display Features
- **Large Text Mode:** Big, readable text for stage visibility
- **Lyrics Display:** Full lyrics for current song
- **Song Metadata:** Artist, key, tempo, performance notes
- **Follower List:** See who's connected (leader only)
- **Touch Gestures:** Swipe navigation on mobile devices

#### Performance Optimizations
- **Caching:** localStorage cache of setlist/song data (5-minute expiry)
- **Prefetching:** Preloads next song's data
- **Offline Support:** Can work with cached data if network drops
- **Real-time Updates:** Instant synchronization across devices

#### Mobile Optimization
- Touch-friendly interface
- Swipe gestures for navigation
- Responsive layout
- Haptic feedback (on supported devices)
- Status bar styling

### 6. Dashboard

#### Overview Widgets
- **Statistics:**
  - Total Songs count
  - Total Setlists count
  - Total Collections count

- **Recent Songs:** Last 5 songs created
- **Recent Setlists:** Last 5 setlists created

#### Quick Actions
- Create new song
- Create new setlist
- Create new collection
- Join active performance session (if available)

#### Active Session Detection
- Automatically detects if another user is leading a performance session
- Shows "Join Performance" option
- Quick access to follow along

### 7. PDF Generation

#### Features
- Generate printable setlist documents
- Includes:
  - Setlist name and date
  - All sets with names
  - Songs with artist, title, key, tempo
  - Page breaks between sets
  - Professional formatting
- Download as PDF
- Optimized for printing (Letter size)

### 8. Admin Features (User Management)

#### User Administration
**View Users:**
- List all users with details
- Shows email, name, role, user level
- Last sign-in timestamp
- Email confirmation status
- Account creation date

**Create Users:**
Two methods:
1. **Invite by Email:** Sends invitation email with magic link
2. **Create with Password:** Creates user account with specified password

**Edit Users:**
- Change name
- Update role
- Modify user level (1, 2, or 3)
- Cannot edit own user level (security)

**Delete Users:**
- Remove user accounts
- Cascade deletes user's data
- Cannot delete own account

**Reset Password:**
- Send password reset email
- Or set new password directly (admin only)

**Resend Invitation:**
- Resend invitation email to users who haven't accepted

---

## Service Layer (API Services)

### 1. `songsService.js`

**Methods:**
- `getAllSongs()` - Fetch all songs, ordered by artist and title
- `getSongById(id)` - Fetch single song by ID
- `createSong(songData)` - Create new song with validation
- `updateSong(id, songData)` - Update existing song
- `deleteSong(id)` - Delete song

**Validation:**
- Required: original_artist, title
- Duplicate detection: (artist + title) must be unique
- Tempo must be numeric if provided

### 2. `setlistsService.js`

**Methods:**
- `getAllSetlists()` - Fetch all accessible setlists (own + public)
- `getSetlistById(id)` - Fetch setlist with all sets (no songs)
- `createSetlist(setlistData)` - Create new setlist
- `updateSetlist(id, setlistData)` - Update setlist name/visibility
- `deleteSetlist(id)` - Delete setlist (cascades to sets/songs)
- `duplicateSetlist(sourceId, newName, userId, isPublic)` - Clone setlist with all sets and songs

**Validation:**
- Required: name, user_id
- Duplicate detection: name must be unique per user

### 3. `setsService.js`

**Methods:**
- `getSetsBySetlistId(setlistId)` - Fetch all sets for a setlist
- `getSetById(id)` - Fetch set with all songs (detailed)
- `createSet(setData)` - Create new set with optional songs
- `updateSet(id, setData)` - Update set name and songs
- `deleteSet(id)` - Delete set and song associations
- `checkForDuplicatesInSetlist(setlistId, songIds, excludeSetId, includeSetNames)` - Check for duplicate songs across sets
- `checkCollectionDuplicates(setlistId, songIds, excludeSetId)` - Check duplicates when adding from collection
- `moveSongsBetweenSets(sourceSets, targetSetId, songIds)` - Transfer songs between sets
- `removeSongFromSet(setId, songId)` - Remove single song from set
- `addSongsToSet(setId, songs)` - Add multiple songs to set

**Business Logic:**
- Maintains song_order within sets
- Checks for duplicates across entire setlist
- Handles complex multi-set operations

### 4. `songCollectionsService.js`

**Methods:**
- `getAllSongCollections()` - Fetch all accessible collections (own + public)
- `getSongCollectionById(id)` - Fetch collection with songs
- `createSongCollection(collectionData)` - Create new collection with songs
- `updateSongCollection(id, collectionData)` - Update collection (replaces all songs)
- `deleteSongCollection(id)` - Delete collection

**Validation:**
- Required: name, user_id
- Duplicate detection: name must be unique per user

### 5. `performanceService.js`

**Session Management:**
- `createSession(setlistId, leaderId)` - Create new performance session
- `getActiveSession(setlistId)` - Get active session for setlist
- `updateSessionPosition(sessionId, setId, songId)` - Update leader's position
- `endSession(sessionId)` - End session for all participants
- `ensureSingleActiveSession(setlistId, leaderId)` - Enforce one-session-per-setlist rule

**Participant Management:**
- `joinAsFollower(sessionId, userId)` - Join session as follower
- `leaveSession(sessionId, userId)` - Leave session
- `getSessionFollowers(sessionId)` - List all followers
- `updateParticipantStatus(sessionId, userId, isActive)` - Mark participant active/inactive

**Leadership Management:**
- `requestLeadership(sessionId, requestingUserId, requestingUserName)` - Request to become leader
- `getPendingLeadershipRequests(sessionId)` - Get pending requests for session
- `respondToLeadershipRequest(requestId, approved, sessionId)` - Approve/reject request
- `transferLeadership(sessionId, newLeaderId)` - Transfer leadership to new user

**Real-time Synchronization:**
- `subscribeToSession(sessionId, callback)` - Subscribe to session updates
- `cleanupSubscriptions()` - Clean up all active subscriptions

**Caching:**
- `cacheSetlistData(setlistId, setlistData, songsData)` - Cache data locally
- `getCachedData(setlistId)` - Retrieve cached data
- `clearCache()` - Clear all cached data
- 5-minute cache expiry
- localStorage-based caching

### 6. `userService.js`

**User Management:**
- `getAllUsers()` - Fetch all users from public.users
- `getAuthUsersData()` - Fetch auth users via Edge Function
- `getMergedUsersData()` - Merge auth and profile data
- `createUser(userData)` - Create new user (via invite or password)
- `updateUser(userId, userData)` - Update user profile and permissions
- `deleteUser(userId)` - Delete user account via Edge Function
- `resetUserPassword(email, newPassword)` - Reset password via Edge Function
- `syncUserProfile(userId, profileData)` - Sync profile data via RPC
- `resendInvitation(email)` - Resend invitation email

**Admin Protection:**
- All methods require admin user_level=3
- Verified via Edge Functions
- Token-based authentication

### 7. `apiService.js`

**Core Utility:**
- `executeQuery(queryFunc)` - Wrapper for Supabase queries with error handling
- Standardizes error responses
- Provides consistent data/error structure

---

## Supabase Edge Functions

### 1. `admin-invite-user`
**Purpose:** Create new user account via admin.

**Authentication:** Requires admin user_level=3

**Methods:**
- POST

**Request Body:**
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "role": "Guitar",
  "user_level": 1,
  "password": "optional-password"
}
```

**Logic:**
- If password provided: Creates user with password (email confirmed)
- If no password: Sends invitation email
- Creates auth user with metadata
- Trigger automatically creates profile in public.users

**Response:**
```json
{
  "success": true,
  "data": { /* auth user data */ }
}
```

### 2. `admin-list-users`
**Purpose:** List all auth users (admin only).

**Authentication:** Requires admin user_level=3

**Methods:**
- GET

**Response:**
```json
{
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "created_at": "timestamp",
      "last_sign_in_at": "timestamp",
      "email_confirmed_at": "timestamp"
    }
  ]
}
```

### 3. `admin-delete-user`
**Purpose:** Delete user account.

**Authentication:** Requires admin user_level=3

**Methods:**
- POST

**Request Body:**
```json
{
  "userId": "uuid"
}
```

**Logic:**
- Deletes from auth.users
- Cascade deletes from public.users and all related data

**Response:**
```json
{
  "success": true
}
```

### 4. `admin-reset-password`
**Purpose:** Reset user password or send reset email.

**Authentication:** Requires admin user_level=3

**Methods:**
- POST

**Request Body:**
```json
{
  "email": "user@example.com",
  "newPassword": "optional-new-password"
}
```

**Logic:**
- If newPassword provided: Sets password directly
- Otherwise: Sends password reset email

**Response:**
```json
{
  "success": true,
  "message": "Password reset email sent" // or "Password updated"
}
```

---

## Security Model

### Row Level Security (RLS)

All tables have RLS enabled with specific policies:

#### Public Data Model
- **Songs:** All authenticated users can CRUD
- **Setlists:** Users can read own + public; manage only own
- **Sets:** Follow parent setlist permissions
- **Set Songs:** Follow parent set permissions
- **Collections:** Users can read own + public; manage only own
- **Collection Songs:** Follow parent collection permissions

#### Performance Sessions
- **Read:** Can access sessions for setlists you can see
- **Manage:** Only leaders can manage their sessions
- **Create:** Any authenticated user can create (as leader)

#### User Management
- **Read Own:** Users can read their own profile
- **Update Own:** Users can update their own profile
- **Admin Read All:** Admins (level 3) can read all users
- **Admin Manage:** Admins can perform all operations on users

### Authentication Flow

1. **Login:**
   - User provides credentials (email/password, magic link, or OAuth)
   - Supabase auth validates credentials
   - Session created in browser (JWT token)
   - AuthContext fetches user profile from public.users
   - Redirects to dashboard or stored redirect path

2. **Session Management:**
   - JWT token stored in browser
   - Automatic refresh on token expiry
   - Auth state listener updates context on changes
   - Session timeout after inactivity

3. **Logout:**
   - Clears Supabase auth session
   - Cleans up performance mode subscriptions
   - Clears localStorage and sessionStorage
   - Redirects to login page

4. **Protected Routes:**
   - PrivateRoute component wraps protected pages
   - Checks AuthContext for authenticated user
   - Redirects to login if not authenticated
   - Stores intended destination for post-login redirect

### Authorization Patterns

#### Client-Side
- User level checked in components
- Admin-only routes (UserManagement) check user.user_level === 3
- UI elements conditionally rendered based on permissions

#### Server-Side (RLS)
- Database policies enforce permissions
- Policies use `(select auth.uid())` for current user
- Policies check user_level for admin operations
- Complex policies use EXISTS subqueries

#### Edge Functions
- Verify JWT token
- Fetch user from public.users
- Check user_level for admin operations
- Return 403 if insufficient permissions

---

## Data Flow Examples

### Example 1: Creating a Setlist with Sets

1. User navigates to Create Setlist page
2. User enters setlist name, optionally marks as public
3. Frontend calls `setlistsService.createSetlist(data)`
4. Service validates name and user_id
5. Service checks for duplicate name via Supabase query
6. Service inserts new setlist row
7. RLS policy checks user owns the setlist (user_id matches)
8. Setlist created, ID returned
9. User can now add sets to the setlist
10. For each set, call `setsService.createSet(setData)`
11. Service inserts set row with setlist_id foreign key
12. Service adds songs via `set_songs` junction table
13. Frontend refreshes and shows complete setlist

### Example 2: Performance Mode (Leader)

1. User navigates to Performance Mode from setlist detail
2. System checks for active sessions on this setlist
3. If none, user chooses "Lead" mode
4. Frontend calls `performanceService.createSession(setlistId, userId)`
5. Service checks for existing active session via `ensureSingleActiveSession()`
6. If no active session, inserts new row in performance_sessions
7. RLS allows creation (user is the leader)
8. Service returns session ID
9. Frontend subscribes to real-time updates via `subscribeToSession()`
10. Frontend loads setlist and songs data, caches locally
11. User navigates songs, updates sent via `updateSessionPosition()`
12. All followers' UIs update automatically via Supabase Realtime
13. When done, user ends session via `endSession()`
14. Session marked is_active=false, all participants cleaned up

### Example 3: Adding Songs from Collection to Set

1. User is editing a set within a setlist
2. User clicks "Add from Collection"
3. Modal shows all available collections (own + public)
4. User selects a collection
5. Frontend calls `songCollectionsService.getSongCollectionById(id)`
6. Service fetches collection with all songs
7. Frontend calls `setsService.checkCollectionDuplicates(setlistId, songIds, currentSetId)`
8. Service queries all songs across all sets in the setlist
9. Returns list of duplicates (if any)
10. Frontend shows warning modal with duplicate list
11. User chooses to skip duplicates or add anyway
12. Frontend calls `setsService.addSongsToSet(setId, songs)`
13. Service inserts rows into `set_songs` table
14. Service assigns song_order values
15. RLS checks user owns the parent setlist
16. Frontend refreshes set view with new songs

---

## Frontend Components

### Key Reusable Components

#### 1. `DraggableList.jsx`
- Drag-and-drop list with react-beautiful-dnd
- Used for reordering songs in sets
- Handles both desktop and touch devices

#### 2. `MobileDragDrop.jsx`
- Mobile-optimized drag-and-drop
- Touch gestures for reordering
- Haptic feedback on supported devices

#### 3. `SongSelector.jsx`
- Modal for selecting songs from library
- Search and filter capabilities
- Multi-select with checkboxes

#### 4. `SongSelectorModal.jsx`
- Enhanced song selector with preview
- Shows song details on hover/tap
- Batch operations

#### 5. `CollectionSelectorModal.jsx`
- Modal for selecting song collections
- Shows song count per collection
- Quick preview of collection contents

#### 6. `DuplicateModal.jsx`
- Warning modal for duplicate songs
- Shows which sets contain duplicates
- Options to skip or force add

#### 7. `CollectionDuplicateModal.jsx`
- Specific to adding from collections
- Lists all duplicates found
- Allows selective addition

#### 8. `FollowersModal.jsx`
- Shows connected followers in performance mode
- Real-time updates
- Leader can see all participants

#### 9. `LeadershipRequestModal.jsx`
- Notification for leadership requests
- Approve/Reject buttons
- Auto-dismiss on timeout

#### 10. `MobilePerformanceLayout.jsx`
- Mobile-optimized performance mode UI
- Swipe gestures
- Large touch targets
- Fullscreen mode support

#### 11. `ResizableTable.jsx`
- Table with resizable columns
- Responsive design
- Column show/hide

#### 12. `MobileOptimizedTable.jsx`
- Card-based layout for mobile
- Touch-friendly
- Swipe actions

#### 13. `ErrorBoundary.jsx`
- Catches React errors
- Shows user-friendly error message
- Prevents full app crash

#### 14. `Sidebar.jsx`
- Main navigation menu
- User profile display
- Active route highlighting
- Mobile hamburger menu

#### 15. `Layout.jsx`
- Main app layout wrapper
- Contains Sidebar and page content
- Responsive grid layout

#### 16. `PrivateRoute.jsx`
- Authentication guard for routes
- Redirects to login if not authenticated
- Stores intended destination

---

## State Management

### Context Providers

#### 1. AuthContext
**State:**
- `user` - Current user object (null if not authenticated)
- `loading` - Initial auth check in progress
- `initialized` - Auth system ready

**Methods:**
- `signIn(email, password)` - Email/password login
- `signInWithGoogle()` - Google OAuth login
- `signInWithMagicLink(email)` - Passwordless login
- `signOut()` - Logout
- `resetPassword(email)` - Send reset email
- `updatePassword(password)` - Change password

**Usage:** Wrap entire app, provides auth state to all components

#### 2. PageTitleContext
**State:**
- `pageTitle` - Current page title string

**Methods:**
- `setPageTitle(title)` - Update page title

**Usage:** Dynamically updates browser tab title and page header

### Local Component State

Most pages use React useState for:
- Form inputs
- Loading states
- Error/success messages
- Modal visibility
- List data (songs, setlists, collections)
- Search/filter criteria

### Caching Strategy

**Performance Mode:**
- Setlist and song data cached in localStorage
- Cache key: `performanceMode_setlistData`, `performanceMode_songsData`
- Cache expiry: 5 minutes
- Reduces API calls during performance
- Improves offline resilience

**Session Data:**
- Session ID stored in localStorage
- Allows rejoin on page refresh
- Cleared on logout or session end

---

## Build and Deployment

### Development
```bash
npm install          # Install dependencies
npm run dev          # Start dev server (Vite)
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix linting issues
npm run typecheck    # Run TypeScript checks
npm run format       # Format code with Prettier
```

### Production Build
```bash
npm run build        # Build for production
npm run preview      # Preview production build
npm run serve        # Serve built files
```

### Docker Deployment (CapRover)
1. **Build Docker Image:**
   - Dockerfile creates Nginx-based container
   - Vite builds static assets
   - Nginx serves files

2. **Runtime Configuration:**
   - Environment variables injected via docker-entrypoint.sh
   - Creates runtime-env.js with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
   - Same image reusable across environments

3. **Deploy to CapRover:**
   ```bash
   caprover deploy
   ```

4. **Set Environment Variables in CapRover:**
   - `VITE_SUPABASE_URL` - Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key

### Environment Variables

**Required:**
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anonymous (public) key

**Optional:**
- Additional Supabase settings configured in supabaseClient.js

---

## Testing & Quality

### Code Quality Tools
- **ESLint:** JavaScript/React linting
- **Prettier:** Code formatting
- **TypeScript:** Type checking (config present)

### Security Tools
- **eslint-plugin-security:** Security linting rules
- **RLS Policies:** Database-level security

### Browser Compatibility
- Modern browsers (ES6+)
- Mobile browsers (iOS Safari, Chrome)
- Progressive Web App (PWA) capable with Capacitor

---

## Mobile Support

### Capacitor Integration
- Capacitor 7.x configured for mobile builds
- Plugins: App, Haptics, SplashScreen, StatusBar
- iOS and Android support ready

### Mobile Optimizations
- Touch-friendly UI
- Swipe gestures
- Responsive layouts
- Mobile performance mode
- Haptic feedback
- Native-like navigation

---

## Performance Optimizations

### Code Splitting
- Lazy loading with React.lazy()
- Route-based splitting
- Suspense boundaries
- PageLoader component

### Build Optimizations
- Vite for fast builds
- Terser for minification
- Tree shaking
- Asset optimization

### Runtime Optimizations
- Debounced search
- Pagination for large lists
- Memoization where applicable
- Efficient re-renders

### Database Optimizations
- Comprehensive indexing
- Optimized RLS policies using `(select auth.uid())`
- Partial indexes for filtered queries
- Efficient join queries

---

## Accessibility

### ARIA Support
- Semantic HTML
- ARIA labels on interactive elements
- Keyboard navigation support

### Visual Design
- High contrast UI (dark theme)
- Large touch targets (minimum 44x44px)
- Clear focus indicators
- Readable font sizes

---

## Error Handling

### Client-Side
- ErrorBoundary catches React errors
- Try-catch blocks in async operations
- User-friendly error messages
- Toast notifications for errors

### API Layer
- apiService.executeQuery() wrapper
- Standardized error responses
- Error logging to console
- Graceful degradation

### Network Issues
- Retry logic for failed requests
- Offline detection
- Cached data fallback
- Connection status indicators

---

## Future Enhancement Suggestions

### Potential Features
1. **Collaborative Editing:** Real-time collaborative setlist editing
2. **Version History:** Track changes to setlists over time
3. **Analytics:** Performance statistics, song popularity
4. **Transposition:** Automatic key transposition for songs
5. **Chord Charts:** Integrated chord diagram display
6. **Audio Integration:** Link songs to audio files/references
7. **Setlist Templates:** Pre-built setlist templates for common scenarios
8. **Advanced Search:** Full-text search on lyrics
9. **Export Formats:** Export to multiple formats (CSV, JSON, etc.)
10. **Mobile Apps:** Native iOS/Android apps using existing Capacitor setup
11. **Practice Mode:** Feature for individual practice sessions
12. **Integration:** Calendar integration for scheduling performances
13. **Notifications:** Push notifications for session invites
14. **Multi-Language:** Internationalization support

### Technical Improvements
1. **Testing:** Unit and integration tests
2. **E2E Testing:** Cypress or Playwright tests
3. **Monitoring:** Error tracking (Sentry, etc.)
4. **Analytics:** User behavior analytics
5. **CI/CD:** Automated testing and deployment
6. **Database Migrations:** Version control for schema changes
7. **API Documentation:** OpenAPI/Swagger for Edge Functions
8. **Performance Monitoring:** Real-time performance tracking

---

## Conclusion

The BH-Setlist-Manager is a feature-rich, well-architected application for music performance management. It provides:

✅ **Comprehensive Song Management:** Full CRUD with rich metadata
✅ **Flexible Setlist Organization:** Multi-level hierarchical structure (Setlist → Sets → Songs)
✅ **Reusable Collections:** Template system for common song groupings
✅ **Real-time Performance Mode:** Synchronized leader-follower system
✅ **User Management:** Multi-level access control
✅ **Mobile-First Design:** Touch-optimized, responsive UI
✅ **Security:** Row-level security, authenticated API
✅ **Scalability:** Cloud-based Supabase backend
✅ **Developer-Friendly:** Clean code structure, modern tooling

The application successfully balances complexity with usability, providing powerful features for band management while maintaining an intuitive user experience.

---

## Database Schema Diagram (Text Representation)

```
┌─────────────────────┐
│      users          │
├─────────────────────┤
│ id (PK)            │
│ email (UNIQUE)     │
│ name               │
│ role               │
│ user_level         │
│ created_at         │
└─────────┬───────────┘
          │
          │ (owns)
          │
    ┌─────┴──────┬──────────────┬──────────────────┐
    │            │              │                  │
    ▼            ▼              ▼                  ▼
┌────────────┐ ┌────────────┐ ┌─────────────────┐ ┌──────────────────────┐
│  setlists  │ │song_collect│ │performance_sess │ │session_participants  │
├────────────┤ ├────────────┤ ├─────────────────┤ ├──────────────────────┤
│ id (PK)    │ │ id (PK)    │ │ id (PK)        │ │ id (PK)             │
│ name       │ │ name       │ │ setlist_id (FK)│ │ session_id (FK)     │
│ user_id(FK)│ │ user_id(FK)│ │ leader_id (FK) │ │ user_id (FK)        │
│ is_public  │ │ is_public  │ │ current_set_id │ │ joined_at           │
│ created_at │ │ created_at │ │ current_song_id│ │ is_active           │
└──────┬─────┘ └──────┬─────┘ │ is_active      │ └──────────────────────┘
       │              │       │ created_at     │
       │              │       └─────────────────┘
       │ (contains)   │
       │              │
       ▼              │
   ┌────────────┐    │
   │    sets    │    │
   ├────────────┤    │
   │ id (PK)    │    │
   │setlist_id  │    │
   │  (FK)      │    │
   │ name       │    │
   │ set_order  │    │
   │ created_at │    │
   └──────┬─────┘    │
          │          │
          │          │
          │(contains)│
          │          │(contains)
          ▼          ▼
    ┌───────────┐  ┌─────────────────────┐
    │set_songs  │  │song_collection_songs│
    ├───────────┤  ├─────────────────────┤
    │set_id(FK) │  │song_collection_id   │
    │song_id(FK)│  │         (FK)        │
    │song_order │  │song_id (FK)        │
    └─────┬─────┘  │song_order          │
          │        └──────┬──────────────┘
          │               │
          │               │
          │(references)   │(references)
          │               │
          └───────┬───────┘
                  │
                  ▼
           ┌─────────────┐
           │    songs    │
           ├─────────────┤
           │ id (PK)     │
           │original_art │
           │ title       │
           │key_signature│
           │ tempo       │
           │ lyrics      │
           │perf_note    │
           │ created_at  │
           └─────────────┘

┌──────────────────────┐
│leadership_requests   │
├──────────────────────┤
│ id (PK)             │
│ session_id (FK)     │──────┐
│ requesting_user_id  │      │
│ requesting_user_name│      │ (relates to)
│ status              │      │
│ expires_at          │      │
│ responded_at        │      ▼
│ created_at          │  ┌─────────────────┐
└──────────────────────┘  │performance_sess │
                          │    (above)      │
                          └─────────────────┘

Legend:
PK = Primary Key
FK = Foreign Key
───> = One-to-Many relationship
```

---

## API Endpoints Summary

### Supabase REST API (Auto-generated)
- **GET /rest/v1/users** - List users
- **GET /rest/v1/songs** - List songs
- **POST /rest/v1/songs** - Create song
- **PATCH /rest/v1/songs?id=eq.{id}** - Update song
- **DELETE /rest/v1/songs?id=eq.{id}** - Delete song
- **GET /rest/v1/setlists** - List setlists
- **POST /rest/v1/setlists** - Create setlist
- **PATCH /rest/v1/setlists?id=eq.{id}** - Update setlist
- **DELETE /rest/v1/setlists?id=eq.{id}** - Delete setlist
- **GET /rest/v1/sets** - List sets
- **POST /rest/v1/sets** - Create set
- **PATCH /rest/v1/sets?id=eq.{id}** - Update set
- **DELETE /rest/v1/sets?id=eq.{id}** - Delete set
- **GET /rest/v1/song_collections** - List collections
- **POST /rest/v1/song_collections** - Create collection
- **PATCH /rest/v1/song_collections?id=eq.{id}** - Update collection
- **DELETE /rest/v1/song_collections?id=eq.{id}** - Delete collection
- **GET /rest/v1/performance_sessions** - List sessions
- **POST /rest/v1/performance_sessions** - Create session
- **PATCH /rest/v1/performance_sessions?id=eq.{id}** - Update session
- (All RLS-protected)

### Supabase Edge Functions
- **POST /functions/v1/admin-invite-user** - Invite/create user
- **GET /functions/v1/admin-list-users** - List auth users
- **POST /functions/v1/admin-delete-user** - Delete user
- **POST /functions/v1/admin-reset-password** - Reset password

### Supabase RPC Functions
- **POST /rest/v1/rpc/sync_user_profile** - Sync user data
- **POST /rest/v1/rpc/cleanup_stale_performance_sessions** - Cleanup sessions
- **POST /rest/v1/rpc/ensure_single_active_session** - Enforce session uniqueness
- **POST /rest/v1/rpc/get_active_session_with_leader** - Get session with leader

### Supabase Realtime
- **WebSocket** - Subscribe to table changes
  - `performance_sessions` - Session updates
  - `session_participants` - Participant updates
  - `leadership_requests` - Request updates

---

*This specification document provides a complete blueprint for recreating the BH-Setlist-Manager application. All major features, database schema, API endpoints, and architectural decisions are documented.*

**Version:** 1.0
**Last Updated:** October 2025
**Author:** AI Agent Analysis
