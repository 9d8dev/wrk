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
2. Copy `.env.example` to `.env.local` and fill in required environment variables (see Environment Variables section below for complete list)
3. `pnpm db:generate` - Generate initial schema
4. `pnpm db:migrate` - Apply migrations
5. `pnpm dev` - Start development server on http://localhost:3000

**Note:** The `.env.example` file provides a template, but refer to the Environment Variables section below for the complete list of all available variables including optional ones.

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
- **Analytics:** Vercel Analytics + PostHog
- **Additional UI:** Vaul (drawer), cmdk (command menu), react-dropzone

### Route Groups
- `(admin)/` - Protected admin dashboard routes
- `(auth)/` - Authentication pages (sign-in)
- `(public)/` - Public portfolio pages with custom usernames
- `api/` - API routes for authentication, uploads, and webhooks

### Authentication Flow
- Better Auth with GitHub/Google OAuth + email/password
- Username plugin for custom portfolio URLs with reserved username enforcement
- Cookie prefix: `"better-auth"`
- Session duration: 30 days with 1-day update threshold and 5-minute cache
- Middleware protects `/admin/*` and `/onboarding` routes only
- Session-based authentication via `auth.api.getSession`
- Public access allowed for all portfolio routes (`/username`, `/username/project`, `/username/contact`), static pages (`/privacy`, `/terms`), and API routes
- Discord notifications sent for new email/password signups
- Reserved usernames: admin, posts, privacy-policy, terms-of-use, about, contact, dashboard, login, sign-in, sign-up, sign-out
- nanoid used for generating unique database IDs
- Client auth dynamically uses `window.location.origin` in browser, `NEXT_PUBLIC_APP_URL` on server

### Database Architecture (Drizzle + PostgreSQL)

Key entities and relationships:
- **User** → **Profile** (1:1) - Extended user information
- **User** → **Projects** (1:many) - Portfolio items with display ordering
- **Project** → **Media** (many:many) - File associations via imageIds JSON array
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
- **Note:** Migration history includes schema changes for project slugs and other database improvements

### Server Actions Pattern
- All data mutations use Next.js Server Actions in `/lib/actions/`
- Server-side validation with Zod schemas
- Automatic revalidation of cached data
- Consistent error/success response pattern: `{ success: boolean, error?: string, data?: T }`
- Error handling with try/catch blocks
- Authentication checks using Better Auth sessions

### Caching & Revalidation Strategy

**ISR (Incremental Static Regeneration):**
- Public profile pages use ISR with 60-second revalidation interval
- Ensures profile updates are reflected within a reasonable timeframe

**Aggressive Revalidation:**
- Utility functions in `/lib/utils/revalidation.ts`:
  - `forceRevalidateProfile(username, userId)` - Revalidates all profile-related paths
  - `forceRevalidateUsernameChange(oldUsername, newUsername, userId)` - Handles username changes
- Server actions automatically trigger revalidation after data mutations
- Cache tags implemented for granular invalidation:
  - `user:{userId}` - User-specific data
  - `projects:{userId}` - User's projects
  - `profile:{profileId}` - Profile-specific data

**Testing Revalidation:**
- Development endpoint: `/api/test-revalidation` - Force revalidation for authenticated user
- Manual endpoint: `/api/revalidate` - POST with `{path, type}` payload
- Profile pages show timestamp in development mode for debugging

### Component Organization
- `/components/ui/` - Shadcn/ui primitives (Button, Dialog, etc.)
- `/components/admin/` - Admin dashboard components
- `/components/profile/` - Public portfolio components including grid layouts
- `/components/analytics/` - PostHog analytics components
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
- GIFs preserved in original format, other images converted to WebP with 85% quality
- Authentication required for all uploads via session cookie
- **Cleanup System:**
  - Automatic R2 file deletion when media is removed from projects
  - `deleteMediaWithCleanup()` and `deleteMediaBatchWithCleanup()` handle both DB and storage cleanup
  - Project deletion automatically cleans up all associated media files

### Multi-Tenant Architecture
- Main domain: `wrk.so`
- Subdomains: `username.wrk.so` (automatic for all users)
- Custom domains: Pro feature with domain verification
- Middleware handles routing based on host header
- Domain context included in all analytics events
- **Subdomain Routing:**
  - `_sites/[domain]` route group handles all subdomain/custom domain requests
  - Mirrors the same structure as public username routes
  - Middleware (`/middleware.ts`) determines routing based on host header
  - Local development: Test subdomains using hosts file or tools like `lvh.me`

### Webhook Architecture
- Comprehensive webhook type system in `/lib/polar-webhook-types.ts`
- Handles events: customer creation/updates, orders, subscriptions, checkouts
- Safe property access patterns for webhook data handling
- Webhook endpoint at `/api/webhooks/polar`

### Key Features
- Multiple grid layouts (masonry, standard, minimal, square)
- Drag-and-drop project reordering with @dnd-kit
- Custom username URLs (`/[username]`)
- Project detail pages (`/[username]/[projectSlug]`)
- Contact forms generating leads in admin dashboard
- Pro subscription via Polar ($12/month)

## Common Development Workflows

**Adding a New Feature to Admin Dashboard:**
1. Create component in `/components/admin/`
2. Add page route in `/app/(admin)/admin/`
3. Update admin navigation in `/components/admin/admin-nav.tsx`
4. Create server actions in `/lib/actions/`
5. Add PostHog event tracking in `/components/analytics/use-posthog-events.ts`

**Creating a New Grid Layout:**
1. Add new grid component in `/components/profile/grids/`
2. Export from `/components/profile/grids/index.tsx`
3. Update theme schema if needed in `/db/schema.ts`
4. Run `pnpm db:generate` and `pnpm db:migrate`

**Adding New Media Type Support:**
1. Update allowed MIME types in `/lib/utils/media.ts`
2. Modify image processing logic in `/lib/utils/image-compression.ts`
3. Update upload validation in `/api/upload/route.ts`
4. Test with various file sizes and formats

**Implementing Custom Domain Feature:**
1. Use domain management component at `/components/admin/domain-management.tsx`
2. Vercel API integration in `/lib/vercel-api.ts`
3. Domain verification endpoint at `/api/pro/domain/verify/route.ts`
4. Update middleware to handle new custom domains

## Development Notes

**File Structure Patterns:**
- Use absolute imports with `@/*` alias
- Server Actions in `/lib/actions/` with proper error handling
- Type definitions inferred from Drizzle schema, extended in `/types/index.ts`
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
- All Server Actions return `{ success: boolean, error?: string, data?: T }` pattern
- Client-side error display using toast notifications
- Form validation errors displayed inline
- Batch operations use `Promise.allSettled()` for partial failure handling

## Environment Variables

Required environment variables (add to `.env.local`):

**Database:**
- `DATABASE_URL` - PostgreSQL connection string

**Authentication:**
- `BETTER_AUTH_SECRET` - Authentication secret
- `BETTER_AUTH_URL` - Better Auth URL (falls back to `NEXT_PUBLIC_APP_URL`)
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth

**Storage:**
- `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` - R2 storage credentials
- `R2_BUCKET` - R2 bucket name
- `R2_ENDPOINT` - R2 endpoint URL
- `R2_PUBLIC_URL` - Public URL for serving R2 files

**Notifications (Optional):**
- `DISCORD_WEBHOOK_URL` - Discord webhook for signup notifications

**Analytics (Optional):**
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog project API key
- `NEXT_PUBLIC_POSTHOG_HOST` - PostHog instance URL (defaults to https://us.i.posthog.com)

**AI Features (Optional):**
- `GROQ_API_KEY` - Groq API key for AI-powered description generation

**Polar Integration:**
- `POLAR_ACCESS_TOKEN` - Organization access token from Polar
- `POLAR_PRO_PRODUCT_ID` - Product ID for the Pro plan
- `POLAR_WEBHOOK_SECRET` - Webhook secret for verification
- `NEXT_PUBLIC_APP_URL` - Your app's URL (e.g., https://wrk.so)

**Vercel API Integration:**
- `VERCEL_API_TOKEN` - Vercel API token for domain management
- `VERCEL_PROJECT_ID` - Vercel project ID
- `VERCEL_TEAM_ID` - Vercel team ID (optional, for team accounts)

## AI Integration

The project includes AI-powered features using Groq:
- **Description Generation:** Automatic project description generation based on project title
- Located in `/components/ai/generate-description.tsx`
- Uses Groq's Llama 3.1 model via AI SDK
- Requires `GROQ_API_KEY` environment variable
- Server action in `/lib/actions/ai.ts` handles the API calls

## Polar Integration

The Polar plugin from @polar-sh/better-auth provides:
- Automatic customer creation on signup
- Pro plan subscription ($12/mo) with checkout flow
- Customer portal for subscription management
- Subscription statuses: `incomplete`, `incomplete_expired`, `trialing`, `active`, `past_due`, `canceled`, `unpaid`
- Dynamic UI based on subscription status
- Server set to 'production' (with 'sandbox' option for testing)

**Pro Plan Benefits:**
- Custom Domain
- Unlimited Projects
- Priority Support
- Advanced Analytics
- Remove Wrk.so Branding

## PostHog Analytics

Comprehensive analytics integration includes:

**Key Features:**
- Page view tracking across all routes including custom domains
- User identification with subscription status and profile data
- Multi-tenant analytics with domain context
- Custom event tracking for all major user actions
- Privacy-first approach with profile creation only for identified users
- Ad-blocker bypass using reverse proxy at `/ingest/*`

**Event Tracking:**
- Portfolio and project views with owner attribution
- Contact form submissions (success/failure)
- Pro subscription events (upgrades, custom domain management)
- User journey events (sign up, onboarding completion)
- Admin actions (project CRUD, theme changes, profile updates)

**Analytics Components:**
- `/components/analytics/posthog-provider.tsx` - Main initialization
- `/components/analytics/posthog-pageview.tsx` - Page view tracking
- `/components/analytics/posthog-user-identifier.tsx` - User identification
- `/components/analytics/use-posthog-events.ts` - Custom event hooks

## Performance Considerations

- Images automatically optimized using Sharp (WebP conversion at 85% quality)
- Turbopack provides fast development builds
- ISR with 60-second revalidation balances freshness and performance
- Database queries should use proper indexing (check migrations)
- R2 cleanup prevents storage bloat
- PostHog analytics loaded asynchronously
- Parallel operations for batch deletions and uploads

## Testing

Currently, the project does not have automated tests configured. When implementing tests:
- Consider Jest and React Testing Library for unit/integration tests
- Use Playwright for E2E testing
- Test Server Actions with proper database mocking
- Ensure authentication flows are properly tested
- Test revalidation behavior in different scenarios