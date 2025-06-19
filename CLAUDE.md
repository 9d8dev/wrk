# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Core Development:**

- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
**Database Operations:**

- `pnpm db:generate` - Generate Drizzle migrations from schema changes
- `pnpm db:migrate` - Apply pending migrations to database
- `pnpm db:push` - Push schema changes directly (dev only)

**Initial Setup:**

1. `pnpm install` - Install dependencies
2. Copy `.env.example` to `.env.local` and fill in required values
3. `pnpm db:generate` - Generate initial schema
4. `pnpm db:migrate` - Apply migrations
5. `pnpm dev` - Start development server

## Architecture Overview

**Wrk.so** is a Next.js 15 portfolio platform using App Router with the following structure:

### Tech Stack

- **Framework:** Next.js 15.4.0-canary with App Router and Turbopack
- **Language:** TypeScript 5.8.3 with React 19
- **Database:** PostgreSQL (Neon serverless) with Drizzle ORM
- **Authentication:** Better Auth v1.2.9 with username plugin and Polar integration
- **File Storage:** R2 compatible S3 storage with Sharp for image processing
- **Styling:** Tailwind CSS v4 with CSS variables
- **Forms:** React Hook Form + Zod validation
- **UI Components:** Shadcn/ui primitives
- **Animations:** Motion library
- **Analytics:** Vercel Analytics
- **Additional UI:** Vaul (drawer), cmdk (command menu), react-dropzone

### Route Groups

- `(admin)/` - Protected admin dashboard routes
- `(auth)/` - Authentication pages (sign-in)
- `(public)/` - Public portfolio pages with custom usernames
- `api/` - API routes for authentication and webhooks

### Authentication Flow

- Better Auth with GitHub/Google OAuth + email/password
- Username plugin for custom portfolio URLs with reserved username enforcement
- Cookie prefix: `"better-auth"`
- Session duration: 30 days with 1-day update threshold and 5-minute cache
- Middleware protects `/admin/*` and `/onboarding` routes
- Session-based authentication via `auth.api.getSession`
- Public access allowed for `/sign-in`, `/`, and `/api/*`
- Discord notifications sent for new email/password signups
- Reserved usernames: admin, posts, privacy-policy, terms-of-use, about, contact, dashboard, login, sign-in, sign-up, sign-out
- nanoid used for generating unique database IDs
- Client auth dynamically uses `window.location.origin` in browser, `NEXT_PUBLIC_APP_URL` on server

### Database Architecture (Drizzle + PostgreSQL)

Key entities and relationships:

- **User** → **Profile** (1:1) - Extended user information
- **User** → **Projects** (1:many) - Portfolio items with display ordering
- **Project** → **Media** (many:many) - File associations via mediaIds JSON array
- **User** → **Theme** (1:1) - Grid layout and appearance settings
- **User** → **Leads** (1:many) - Contact form submissions
- **Profile** → **SocialLinks** (1:many) - Social media links with display ordering
- **User** → **SubscriptionHistory** (1:many) - Polar subscription tracking

**Important:** Projects and SocialLinks use `displayOrder` field for manual sorting

**Database Migration Workflow:**

- Migrations stored in `/db/migrations/`
- Each migration has an associated snapshot in `/db/migrations/meta/`
- Use `pnpm db:generate` to create new migrations from schema changes
- Use `pnpm db:migrate` to apply pending migrations
- **Note:** Migration history includes schema changes for project slugs and other database improvements. Use `pnpm db:migrate` to apply any pending migrations.

### Server Actions Pattern

- All data mutations use Next.js Server Actions in `/lib/actions/`
- Server-side validation with Zod schemas
- Automatic revalidation of cached data
- Consistent error/success response pattern
- Error handling with try/catch blocks

### Component Organization

- `/components/ui/` - Shadcn/ui primitives (Button, Dialog, etc.)
- `/components/admin/` - Admin dashboard components
- `/components/profile/` - Public portfolio components including grid layouts
- `/lib/data/` - Server-side data fetching utilities

### Media Management

- R2 (S3 compatible) integration for file uploads
- Sharp for image processing with automatic optimization
- **Upload System:**
  - API route at `/api/upload` for direct file uploads (avoids server action size limits)
  - Client utilities in `/lib/utils/upload.ts` for handling uploads
  - Bypasses base64 encoding overhead of server actions
- **Upload Limits:**
  - Client-side validation: 15MB per file
  - Server-side validation: 15MB per file
  - Next.js server action body limit: 50MB total request size
  - Profile images: 1MB limit
- Files served from `images.wrk.so` domain
- Allowed remote image sources: `images.wrk.so`, `*.googleusercontent.com`, `avatars.githubusercontent.com`
- Media entities track dimensions, size, and MIME type
- Supported formats: JPEG, PNG, WebP, GIF
- GIFs are preserved in original format, other images converted to WebP with 85% quality
- Client-side file size validation prevents oversized uploads
- Server-side validation with detailed error messages
- Batch upload error handling reports individual file failures
- Authentication required for all uploads via session cookie

### Webhook Architecture

- Comprehensive webhook type system in `/lib/polar-webhook-types.ts`
- Handles events: customer creation/updates, orders, subscriptions, checkouts
- Safe property access patterns for webhook data handling with fallbacks for different payload structures
- Webhook endpoint at `/api/webhooks/polar`

### Key Features

- Multiple grid layouts (masonry, standard, minimal, square)
- Drag-and-drop project reordering with @dnd-kit
- Custom username URLs (`/[username]`)
- Project detail pages (`/[username]/[projectSlug]`)
- Contact forms generating leads in admin dashboard
- Pro subscription via Polar ($12/month)

## Development Notes

**File Structure Patterns:**

- Use absolute imports with `@/*` alias
- Server Actions in `/lib/actions/` with proper error handling
- Type definitions in `/types/index.ts`
- Database schema in `/db/schema.ts`

**State Management:**

- Server state via Server Actions and revalidation
- Client state with React hooks (no global state library)
- Form handling with React Hook Form + Zod validation

**Styling:**

- Tailwind CSS v4 with CSS variables for theming
- Component variants using class-variance-authority
- Responsive design with mobile-first approach
- Uses `@theme inline` directive with OKLCH color space
- Custom variant for dark mode: `@custom-variant dark (&:is(.dark *))`
- `tw-animate-css` plugin for animations
- Custom utilities: `.no-scrollbar`, shimmer animation

**Error Handling Patterns:**

- All Server Actions return `{ error?: string, data?: T }` pattern
- Client-side error display using toast notifications
- Form validation errors displayed inline

## Environment Variables

Required environment variables (add to `.env.local`):

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Authentication secret
- `BETTER_AUTH_URL` - Better Auth URL configuration (falls back to `NEXT_PUBLIC_APP_URL`)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` - R2 storage credentials
- `R2_BUCKET` - R2 bucket name
- `R2_ENDPOINT` - R2 endpoint URL
- `R2_PUBLIC_URL` - Public URL for serving R2 files
- `DISCORD_WEBHOOK_URL` - Discord webhook URL for notifications (optional)

### PostHog Analytics

- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog project API key for analytics tracking
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog instance URL (defaults to https://us.i.posthog.com)

### Polar Integration

- `POLAR_ACCESS_TOKEN` - Organization access token from Polar
- `POLAR_PRO_PRODUCT_ID` - Product ID for the Pro plan
- `POLAR_WEBHOOK_SECRET` - Webhook secret for secure webhook verification
- `NEXT_PUBLIC_APP_URL` - Your app's URL (e.g., https://wrk.so)

## Discord Notifications

Discord webhook notifications are sent when:

- New users sign up (email/password registration)
- Notification includes: name, username, email, and portfolio URL
- Configure by setting `DISCORD_WEBHOOK_URL` environment variable

## Polar Integration

The Polar plugin from @polar-sh/better-auth has been integrated with:

- Automatic customer creation on signup
- Pro plan subscription ($12/mo) with checkout flow
- Customer portal for subscription management
- Subscription status stored in database with statuses: `incomplete`, `incomplete_expired`, `trialing`, `active`, `past_due`, `canceled`, `unpaid`
- Dynamic UI based on subscription status
- Server set to 'production' (with 'sandbox' option for testing)

### Pro Plan Benefits

- Custom Domain
- Unlimited Projects
- Priority Support
- Advanced Analytics
- Remove Wrk.so Branding

## TypeScript Configuration

- Strict mode enabled
- Module resolution: bundler
- Next.js plugin included
- Path alias `@/*` maps to root directory

## Project Overview

This is a design engineer portfolio application built with Next.js 15, TypeScript, and shadcn/ui components. The application allows users to showcase their projects with media uploads.

## Recent Implementation: S3/R2 Media Cleanup

### Problem

Previously, when users deleted images from their projects or deleted entire projects, the media files remained orphaned in the Cloudflare R2 storage bucket. This led to:

- Unnecessary storage costs
- Cluttered storage buckets
- No way to reclaim space from deleted media

### Solution

Implemented comprehensive media cleanup functionality that automatically deletes files from R2 storage when they're removed from the application:

#### Core Functions (`lib/actions/media.ts`)

- `deleteMediaWithCleanup(id: string)` - Deletes a single media record and its R2 file
- `deleteMediaBatchWithCleanup(ids: string[])` - Deletes multiple media records and their R2 files
- `extractKeyFromUrl(url: string)` - Extracts R2 key from media URLs for deletion
- `deleteFromR2(key: string)` - Handles actual R2 file deletion
- `deleteMultipleFromR2(keys: string[])` - Parallel deletion of multiple R2 files

#### Integration Points

1. **Project Deletion** (`lib/actions/project.ts`)

   - When a project is deleted, all associated media files are automatically cleaned up
   - Uses `getAllMediaByProjectId()` to find all project media before deletion
   - Calls `deleteMediaBatchWithCleanup()` to remove files from both database and R2

2. **Individual Image Removal** (`components/admin/project-form.tsx`)

   - When users remove images from the project form, existing images are deleted from R2
   - Modified `handleRemoveImage()` to call `deleteMediaWithCleanup()` for existing images
   - Provides user feedback via toast notifications

3. **API Endpoint** (`app/api/media/route.ts`)
   - Added DELETE method for programmatic media deletion
   - Accessible at `DELETE /api/media?id={mediaId}`
   - Returns JSON response with success/error status

#### Error Handling

- Database deletion takes priority - R2 deletion failures don't block database cleanup
- Uses `Promise.allSettled()` for batch operations to continue even if some files fail
- Comprehensive logging for debugging R2 deletion issues
- Graceful fallback if URL key extraction fails

#### Benefits

- **Cost Savings**: Eliminates orphaned files from R2 storage
- **Clean Storage**: Maintains organized bucket structure
- **User Experience**: Instant visual feedback when removing images
- **Data Integrity**: Ensures database and storage remain in sync
- **Performance**: Parallel deletion for batch operations

#### Technical Details

- Supports all image formats (JPEG, PNG, WebP, GIF)
- Handles both direct uploads and API route uploads
- Compatible with Cloudflare R2's S3-compatible API
- Uses AWS SDK v3 for R2 operations
- Maintains backward compatibility with existing media operations

#### Security

- All operations require authentication
- User ownership validation before deletion
- No direct R2 credential exposure to client-side

This implementation ensures that the portfolio application maintains clean storage while providing users with intuitive media management capabilities.

## Testing

Currently, the project does not have automated tests configured. When implementing tests:

- Consider using Jest and React Testing Library for unit and integration tests
- Use Playwright or similar for E2E testing
- Test Server Actions with proper mocking of database operations
- Ensure authentication flows are properly tested

## Analytics Integration

### PostHog Analytics

The application includes comprehensive PostHog analytics integration for user behavior tracking, product analytics, and business intelligence.

**Setup Requirements:**
- Add `NEXT_PUBLIC_POSTHOG_KEY` to environment variables (get from PostHog project settings)
- `NEXT_PUBLIC_POSTHOG_HOST` defaults to `https://us.i.posthog.com`

**Key Features:**
- **Page View Tracking**: Automatic tracking across all routes including custom domains
- **User Identification**: Authenticated users are identified with subscription status and profile data
- **Multi-Tenant Analytics**: Domain-aware tracking (main domain, subdomains, custom domains)
- **Custom Event Tracking**: Portfolio views, project interactions, contact form submissions, Pro feature usage
- **Privacy-First**: Only creates profiles for identified users, masks sensitive inputs
- **Ad-Blocker Bypass**: Uses reverse proxy at `/ingest/*` to avoid tracking blockers

**Available Event Tracking:**
- Portfolio and project views with owner attribution
- Contact form submissions (success/failure)
- Pro subscription events (upgrades, custom domain management)
- User journey events (sign up, onboarding completion)
- Admin actions (project CRUD, theme changes, profile updates)

**Analytics Components:**
- `/components/analytics/posthog-provider.tsx` - Main PostHog initialization
- `/components/analytics/posthog-pageview.tsx` - Page view tracking
- `/components/analytics/posthog-user-identifier.tsx` - User identification for admin areas
- `/components/analytics/use-posthog-events.ts` - Custom event tracking hooks

**Usage Example:**
```typescript
import { usePostHogEvents } from '@/components/analytics';

const { trackPortfolioView, trackProjectCreated } = usePostHogEvents();

// Track portfolio view
trackPortfolioView(username, 'custom_domain');

// Track project creation
trackProjectCreated();
```

**Integration Notes:**
- Works alongside existing Vercel Analytics
- Integrated into admin layout for authenticated user tracking
- Domain context automatically included in all events
- Ready for feature flags and A/B testing expansion

## Performance Considerations

- Images are automatically optimized using Sharp (WebP conversion at 85% quality)
- Turbopack provides fast development builds
- Database queries should use proper indexing (check migrations)
- Consider implementing caching strategies for frequently accessed data
- Monitor R2 storage usage and implement cleanup policies if needed
- PostHog analytics are loaded asynchronously and don't impact page performance
