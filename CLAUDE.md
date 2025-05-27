# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

**Core Development:**
- `pnpm dev` - Start development server with Turbopack
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint

**Database Operations:**
- `pnpm db:generate` - Generate Drizzle migrations from schema changes
- `pnpm db:migrate` - Apply pending migrations to database
- `pnpm db:push` - Push schema changes directly (dev only)

## Architecture Overview

**Wrk.so** is a Next.js 15 portfolio platform using App Router with the following structure:

### Route Groups
- `(admin)/` - Protected admin dashboard routes
- `(auth)/` - Authentication pages (sign-in)
- `(public)/` - Public portfolio pages with custom usernames
- `api/` - API routes for authentication

### Authentication Flow
- Better Auth with GitHub/Google OAuth + email/password
- Username plugin for custom portfolio URLs
- Middleware protects admin routes and redirects appropriately
- Session-based authentication with Next.js integration

### Database Architecture (Drizzle + PostgreSQL)
Key entities and relationships:
- **User** → **Profile** (1:1) - Extended user information
- **User** → **Projects** (1:many) - Portfolio items with display ordering
- **Project** → **Media** (many:many) - File associations via imageIds JSON array
- **User** → **Theme** (1:1) - Grid layout and appearance settings
- **User** → **Leads** (1:many) - Contact form submissions

### Server Actions Pattern
- All data mutations use Next.js Server Actions in `/lib/actions/`
- Server-side validation with Zod schemas
- Automatic revalidation of cached data

### Component Organization
- `/components/ui/` - Shadcn/ui primitives (Button, Dialog, etc.)
- `/components/admin/` - Admin dashboard components
- `/components/profile/` - Public portfolio components including grid layouts
- `/lib/data/` - Server-side data fetching utilities

### Media Management
- S3 integration for file uploads (AWS SDK)
- Sharp for image processing
- 10MB upload limit configured in Next.js

### Key Features
- Multiple grid layouts (masonry, standard, minimal, square)
- Drag-and-drop project reordering with @dnd-kit
- Custom username URLs (`/[username]`)
- Project detail pages (`/[username]/[projectSlug]`)
- Contact forms generating leads in admin dashboard

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
- Tailwind CSS with CSS variables for theming
- Component variants using class-variance-authority
- Responsive design with mobile-first approach