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
- **Framework:** Next.js 15.3.2 with App Router and Turbopack
- **Language:** TypeScript with React 19
- **Database:** PostgreSQL (Neon) with Drizzle ORM
- **Authentication:** Better Auth with username plugin
- **File Storage:** AWS S3 (via R2) with Sharp for image processing
- **Styling:** Tailwind CSS v4 with CSS variables
- **Forms:** React Hook Form + Zod validation
- **UI Components:** Shadcn/ui primitives
- **Animations:** Motion library
- **Analytics:** Vercel Analytics
- **Payments:** Polar integration for subscriptions
- **Additional UI:** Vaul (drawer), cmdk (command menu), react-dropzone

### Route Groups
- `(admin)/` - Protected admin dashboard routes
- `(auth)/` - Authentication pages (sign-in)
- `(public)/` - Public portfolio pages with custom usernames
- `api/` - API routes for authentication and webhooks
- `onboarding/` - User onboarding flow

### Authentication Flow
- Better Auth with GitHub/Google OAuth + email/password
- Username plugin for custom portfolio URLs
- Middleware protects `/admin/*` and `/onboarding` routes
- Session-based authentication via `getSessionCookie` from better-auth/cookies
- Public access allowed for `/sign-in`, `/`, and `/api/*`
- 30-day session expiry with 1-day update age

### Database Architecture (Drizzle + PostgreSQL)

Key entities and relationships:
- **User** → **Profile** (1:1) - Extended user information
- **User** → **Projects** (1:many) - Portfolio items with display ordering
- **Project** → **Media** (many:many) - File associations via imageIds JSON array
- **User** → **Theme** (1:1) - Grid layout and appearance settings
- **User** → **Leads** (1:many) - Contact form submissions
- **Profile** → **SocialLinks** (1:many) - Social media links with display ordering
- **User** → **SubscriptionHistory** (1:many) - Polar subscription event tracking

**Important:** Projects and SocialLinks use `displayOrder` field for manual sorting

### Server Actions Pattern
- All data mutations use Next.js Server Actions in `/lib/actions/`
- Server-side validation with Zod schemas
- Automatic revalidation of cached data
- Error handling with proper authentication checks

### Component Organization
- `/components/ui/` - Shadcn/ui primitives (Button, Dialog, etc.)
- `/components/admin/` - Admin dashboard components
- `/components/profile/` - Public portfolio components including grid layouts
- `/components/icons/` - Custom icon components
- `/lib/data/` - Server-side data fetching utilities

### Media Management
- R2 (Cloudflare's S3-compatible storage) integration for file uploads
- Sharp for image processing (preserves GIFs)
- 10MB upload limit configured in Next.js
- Images served from `images.wrk.so` domain
- Support for multiple file uploads per project

### Key Features
- Multiple grid layouts (masonry, standard, minimal, square)
- Drag-and-drop project reordering with @dnd-kit
- Custom username URLs (`/[username]`)
- Project detail pages (`/[username]/[projectSlug]`)
- Contact forms generating leads in admin dashboard
- Theme switching (light/dark/system)
- Static Site Generation (SSG) for portfolio pages

## Environment Variables

Required environment variables (add to `.env.local`):

```env
# Database
DATABASE_URL=              # PostgreSQL connection string

# Authentication
BETTER_AUTH_SECRET=        # Random secret for auth
BETTER_AUTH_URL=           # App URL (e.g., http://localhost:3000)

# OAuth Providers
GITHUB_CLIENT_ID=          # GitHub OAuth app ID
GITHUB_CLIENT_SECRET=      # GitHub OAuth app secret
GOOGLE_CLIENT_ID=          # Google OAuth client ID
GOOGLE_CLIENT_SECRET=      # Google OAuth client secret

# File Storage (R2)
R2_ACCESS_KEY_ID=          # Cloudflare R2 access key
R2_SECRET_ACCESS_KEY=      # Cloudflare R2 secret key
R2_BUCKET=                 # R2 bucket name
R2_ENDPOINT=               # R2 endpoint URL

# Polar Subscriptions
POLAR_ACCESS_TOKEN=        # Organization access token from Polar
POLAR_PRO_PRODUCT_ID=      # Product ID for the Pro plan
POLAR_WEBHOOK_SECRET=      # Webhook secret for secure webhook verification

# Optional
DISCORD_WEBHOOK_URL=       # Discord webhook URL for notifications
```

## Discord Notifications

Discord webhook notifications are sent when:
- New users sign up (email/password registration)
- Notification includes: name, username, email, and portfolio URL
- Configure by setting `DISCORD_WEBHOOK_URL` environment variable

## Polar Integration

The Polar plugin from @polar-sh/better-auth has been fully integrated with:

### Configuration
- Server-side configuration in `/lib/auth.ts` with checkout and portal plugins
- Client-side configuration in `/lib/auth-client.ts`
- Product configuration in `/lib/config/polar.ts`
- Server actions in `/lib/actions/polar.ts` and `/lib/actions/subscription.ts`

### Features
- Automatic customer creation on signup
- Pro plan subscription ($12/mo) with checkout flow
- Customer portal for subscription management
- Subscription status display in admin sidebar
- Webhook handling for subscription lifecycle events
- Subscription history tracking in database

### Webhook Events Handled
- `customer.created` - Links Polar customer to user
- `subscription.created` - Records new subscription
- `subscription.active` - Activates user subscription
- `subscription.canceled` - Updates subscription status
- `order.paid` - Logs successful payments

### Pro Plan Benefits
- Custom Domain
- Unlimited Projects
- Priority Support
- Advanced Analytics
- Remove Wrk.so Branding

## Development Notes

**File Structure Patterns:**
- Use absolute imports with `@/*` alias
- Server Actions in `/lib/actions/` with proper error handling
- Type definitions in `/types/index.ts` and database types in schema
- Database schema in `/db/schema.ts`

**State Management:**
- Server state via Server Actions and revalidation
- Client state with React hooks (no global state library)
- Form handling with React Hook Form + Zod validation

**Styling:**
- Tailwind CSS v4 with CSS variables for theming
- Component variants using class-variance-authority
- Responsive design with mobile-first approach
- Custom animations with tw-animate-css

**Image Optimization:**
- Sharp processes images on upload
- GIF support preserved
- Automatic dimension extraction
- WebP conversion for non-GIF images

## Planned Features

Features planned but not yet implemented:
- Stripe payment integration via Better Auth
- Theme Provider from shadcn
- Privacy policy and terms of service pages

## Security Considerations

- Session cookies with secure configuration
- CSRF protection built into Better Auth
- Input validation on all forms
- SQL injection protection via Drizzle ORM
- File upload restrictions (type and size)
- Webhook signature verification for Polar

## Deployment

The app is configured for Vercel deployment:
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

Note: Static paths are generated for all user portfolio pages during build.