# Revalidation Setup for Wrk.so

## Overview

This document explains the revalidation strategy implemented to ensure that user profile pages update properly when users create or update their accounts.

## The Problem

The public profile pages at `@app/(public)/[username]/` were not reflecting updates immediately after users:
- Created their profile during onboarding
- Updated their profile information
- Changed their username
- Added/updated projects
- Changed theme settings

This was due to Next.js's aggressive caching with static generation (SSG).

## The Solution

### 1. **Incremental Static Regeneration (ISR)**

Added ISR to the public profile page with a 60-second revalidation interval:

```typescript
// app/(public)/[username]/page.tsx
export const revalidate = 60; // Revalidate every 60 seconds
```

### 2. **Aggressive Revalidation Utility**

Created utility functions in `/lib/utils/revalidation.ts`:

- `forceRevalidateProfile(username, userId)` - Revalidates all paths related to a user's profile
- `forceRevalidateUsernameChange(oldUsername, newUsername, userId)` - Handles username changes

These functions:
- Revalidate multiple path variations (base path, layout, page)
- Invalidate cache tags for fine-grained cache control
- Handle errors gracefully

### 3. **Enhanced Server Actions**

Updated all server actions to use aggressive revalidation:

- **Profile Actions** (`/lib/actions/profile.ts`):
  - `updateProfile` - Full revalidation on profile updates
  - `createProfile` - Revalidates after profile creation
  - `updateUsername` - Special handling for username changes

- **Project Actions** (`/lib/actions/project.ts`):
  - `createProject` - Revalidates user's profile after project creation
  - `updateProject` - Handles slug changes and profile revalidation
  - `deleteProject` - Ensures profile reflects deleted projects

- **Theme Actions** (`/lib/actions/theme.ts`):
  - `updateTheme` - Revalidates profile to reflect new grid layout

### 4. **Cache Tags**

Implemented cache tags for more granular invalidation:
- `user:{userId}` - User-specific data
- `projects:{userId}` - User's projects
- `profile:{profileId}` - Profile-specific data

### 5. **Testing Endpoints**

Added development endpoints for testing:

- `/api/test-revalidation` - Force revalidation for authenticated user
- `/api/revalidate` - Manual revalidation endpoint (POST)

## Usage

### For Developers

1. **Testing Revalidation**:
   ```bash
   curl http://localhost:3000/api/test-revalidation \
     -H "Cookie: your-auth-cookies"
   ```

2. **Manual Revalidation**:
   ```bash
   curl -X POST http://localhost:3000/api/revalidate \
     -H "Content-Type: application/json" \
     -H "Cookie: your-auth-cookies" \
     -d '{"path": "/username", "type": "path"}'
   ```

3. **Debug Mode**: In development, profile pages show a timestamp to verify when they were last rendered.

### Best Practices

1. Always use the revalidation utilities when updating user data
2. Test revalidation after implementing new features that modify user data
3. Monitor the revalidation performance in production

## Troubleshooting

If profile pages still don't update:

1. Check browser cache - try hard refresh (Cmd+Shift+R)
2. Verify the revalidation paths match the actual routes
3. Check server logs for revalidation errors
4. Use the test endpoints to force revalidation
5. In extreme cases, consider reducing the ISR interval

## Future Improvements

1. Implement WebSocket notifications for real-time updates
2. Add cache warming after updates
3. Implement more granular cache tags
4. Add monitoring for cache hit rates