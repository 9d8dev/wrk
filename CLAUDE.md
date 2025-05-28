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

**Initial Setup:**

1. `pnpm install` - Install dependencies
2. Copy environment variables to `.env.local`
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
- **File Storage:** AWS S3 with Sharp for image processing
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
- `api/` - API routes for authentication

### Authentication Flow

- Better Auth with GitHub/Google OAuth + email/password
- Username plugin for custom portfolio URLs
- Middleware protects `/admin/*` and `/onboarding` routes
- Session-based authentication via `getSessionCookie` from better-auth/cookies
- Public access allowed for `/sign-in`, `/`, and `/api/*`

### Database Architecture (Drizzle + PostgreSQL)

Key entities and relationships:

- **User** → **Profile** (1:1) - Extended user information
- **User** → **Projects** (1:many) - Portfolio items with display ordering
- **Project** → **Media** (many:many) - File associations via imageIds JSON array
- **User** → **Theme** (1:1) - Grid layout and appearance settings
- **User** → **Leads** (1:many) - Contact form submissions
- **Profile** → **SocialLinks** (1:many) - Social media links with display ordering

**Important:** Projects and SocialLinks use `displayOrder` field for manual sorting

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

## Environment Variables

Required environment variables (add to `.env.local`):

- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Authentication secret
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` - GitHub OAuth
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` / `AWS_REGION` - S3 storage
- `S3_BUCKET_NAME` - S3 bucket for media uploads
- `DISCORD_WEBHOOK_URL` - Discord webhook URL for notifications (optional)

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

## Planned Features

Features planned but not yet implemented:

- Stripe payment integration via Better Auth
- Theme Provider from shadcn
- Privacy policy and terms of service pages

## Polar Integration

The Polar plugin from @polar-sh/better-auth has been fully integrated with:

### Configuration

- Server-side configuration in `/lib/auth.ts` with checkout and portal plugins
- Client-side configuration in `/lib/auth-client.ts`
- Product configuration in `/lib/config/polar.ts`
- Server actions in `/lib/actions/polar.ts`

### Features

- Automatic customer creation on signup
- Pro plan subscription ($12/mo) with checkout flow
- Customer portal for subscription management
- Subscription status display in admin sidebar
- Dynamic UI based on subscription status

### Environment Variables

- `POLAR_ACCESS_TOKEN` - Organization access token from Polar
- `POLAR_PRO_PRODUCT_ID` - Product ID for the Pro plan
- `NEXT_PUBLIC_APP_URL` - Your app's URL (e.g., https://wrk.so)

### Pro Plan Benefits

- Custom Domain
- Unlimited Projects
- Priority Support
- Advanced Analytics
- Remove Wrk.so Branding

## Polar MCP Integration

The project includes comprehensive Polar MCP (Model Context Protocol) integration for webhook development and testing:

### Using Polar MCP for Development

The Polar MCP provides direct access to the Polar API for:

- Fetching subscription data
- Retrieving order information
- Managing customers
- Getting metrics and analytics
- Testing webhook payloads

### Available MCP Functions

Key Polar MCP functions available:

```typescript
// Subscriptions
mcp_Polar_subscriptions-list({ request: { limit: 10, active: true } })
mcp_Polar_subscriptions-get({ request: { id: "sub_123" } })
mcp_Polar_subscriptions-update({ request: { id: "sub_123", SubscriptionUpdate: {...} } })

// Orders
mcp_Polar_orders-list({ request: { limit: 10 } })
mcp_Polar_orders-get({ request: { id: "order_123" } })

// Customers
mcp_Polar_customers-list({ request: { limit: 10 } })
mcp_Polar_customers-get({ request: { id: "cus_123" } })
mcp_Polar_customers-create({ request: { email: "user@example.com" } })

// Products
mcp_Polar_products-list({ request: { limit: 10 } })
mcp_Polar_products-get({ request: { id: "prod_123" } })

// Metrics
mcp_Polar_metrics-get({
  request: {
    start_date: "2024-01-01",
    end_date: "2024-01-31",
    interval: "day"
  }
})
```

### Webhook Testing Script

Use the provided testing script to validate webhook integration:

```bash
npx tsx scripts/polar-webhook-test.ts
```

This script demonstrates:

- Fetching real data via Polar MCP
- Testing webhook payload structures
- Validating type safety
- Debugging webhook handlers

### Type-Safe Webhook Handling

The project includes comprehensive TypeScript types for Polar webhooks in `lib/polar-webhook-types.ts`:

```typescript
import {
  PolarWebhookEvent,
  SubscriptionData,
  OrderData,
  isSubscriptionEvent,
  handleWebhookEvent,
} from "@/lib/polar-webhook-types";

// Type-safe webhook handling
function handleWebhook(event: PolarWebhookEvent) {
  if (isSubscriptionEvent(event)) {
    // TypeScript knows this is a subscription event
    console.log("Subscription:", event.data.status);
  }

  // Centralized event handling
  return handleWebhookEvent(event);
}
```

## Development

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables (see above)

3. Run database migrations:

```bash
npm run db:push
```

4. Start development server:

```bash
npm run dev
```

5. Test Polar integration:

```bash
npx tsx scripts/polar-webhook-test.ts
```

## Deployment

The app is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Webhook Configuration

Configure Polar webhooks to point to:

- Production: `https://wrk.so/api/auth/polar/webhooks`
- Development: Use ngrok or similar for local testing

## Key Files

- `app/layout.tsx` - Root layout with auth provider
- `lib/auth.ts` - Better Auth configuration with Polar
- `lib/actions/polar.ts` - Polar-related server actions
- `lib/polar-webhook-types.ts` - Type-safe webhook handling
- `scripts/polar-webhook-test.ts` - Webhook testing utilities
- `db/schema.ts` - Database schema
- `components/ui/` - shadcn/ui components

## Pro Subscription Features

The Pro subscription ($12/month) unlocks:

- Advanced portfolio customization
- Priority support
- Additional file storage
- Premium templates
- Analytics dashboard

Subscription status is checked server-side using the `hasActiveProSubscription()` function, which queries the Polar customer state API for real-time subscription status.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Polar MCP if subscription-related
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
