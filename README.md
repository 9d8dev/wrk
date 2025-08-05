# Wrk.so - Modern Portfolio Platform for Creatives

Wrk.so is a Next.js 15 portfolio platform that enables creatives to build stunning online portfolios with custom domains, multiple grid layouts, and professional features.

## ✨ Key Features

### Core Portfolio Features

- **Custom Username URLs** - Get your personalized portfolio at `wrk.so/yourname`
- **Multiple Grid Layouts** - Choose from masonry, standard, minimal, or square layouts
- **Drag-and-Drop Reordering** - Easily organize your projects with intuitive controls
- **Project Showcases** - Rich media galleries with detailed descriptions
- **Contact Forms** - Built-in lead generation and management system

### Pro Features ($12/month)

- **Custom Domains** - Use your own domain (e.g., `yourname.com`)
- **Unlimited Projects** - No limits on your creative showcase
- **Priority Support** - Get help when you need it
- **Advanced Analytics** - Deep insights into your portfolio performance
- **Remove Branding** - Complete white-label experience

### Technical Highlights

- **Blazing Fast** - Built with Next.js 15 and Turbopack
- **Type-Safe** - Full TypeScript with Zod validation
- **Modern Auth** - OAuth (GitHub/Google) + email/password with Better Auth
- **Optimized Media** - Automatic image optimization with Sharp
- **Real-time Updates** - ISR with aggressive cache revalidation
- **Analytics** - PostHog + Vercel Analytics integration

## 🛠 Tech Stack

- **Framework:** Next.js 15.4.0 (App Router) with Turbopack
- **Language:** TypeScript 5.8.3 with React 19
- **Database:** PostgreSQL (Neon serverless) with Drizzle ORM
- **Authentication:** Better Auth v1.2.9
- **Styling:** Tailwind CSS v4 with Shadcn/ui components
- **File Storage:** R2/S3 compatible storage
- **Payments:** Polar for subscriptions
- **Analytics:** PostHog + Vercel Analytics

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm package manager
- PostgreSQL database (we recommend Neon)
- R2/S3 bucket for media storage

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd wrk
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   ```

   Fill in your `.env.local` with required values:
   - Database connection string
   - Authentication secrets
   - OAuth credentials (GitHub/Google)
   - R2/S3 storage credentials
   - See CLAUDE.md for complete list

4. **Set up the database**

   ```bash
   pnpm db:generate  # Generate migrations
   pnpm db:migrate   # Apply migrations
   ```

5. **Start the development server**

   ```bash
   pnpm dev
   ```

   Visit `http://localhost:3000` to see your local instance.

## 📝 Development Commands

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run linting
pnpm db:generate  # Generate DB migrations
pnpm db:migrate   # Apply DB migrations
```

## 🏗 Project Structure

```
/app              # Next.js App Router pages
├── (admin)/      # Admin dashboard (protected)
├── (auth)/       # Authentication pages
├── (public)/     # Public portfolio pages
└── api/          # API routes

/components       # React components
├── admin/        # Admin-specific components
├── profile/      # Portfolio components
└── ui/          # Shadcn/ui primitives

/lib             # Core utilities
├── actions/      # Server Actions
├── data/        # Data fetching
└── utils/       # Helper functions

/db              # Database
├── schema.ts    # Drizzle schema
└── migrations/  # Migration files
```

## 🔐 Authentication

Wrk.so uses Better Auth with:

- GitHub OAuth
- Google OAuth
- Email/password
- Magic links
- Session-based authentication (30-day duration)
- Reserved username protection

## 🎨 Customization

### Grid Layouts

Choose from multiple professional layouts:

- **Masonry** - Pinterest-style variable heights
- **Standard** - Clean, uniform grid
- **Minimal** - Focus on content
- **Square** - Instagram-style layout

### Themes

Customize colors, typography, and spacing through the admin dashboard.

## 📊 Analytics

Built-in analytics with:

- Page view tracking
- User journey events
- Custom domain attribution
- Privacy-first approach
- Ad-blocker bypass

## 🚢 Deployment

Wrk.so is optimized for deployment on Vercel:

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

Custom domains are automatically configured through the Vercel API.

## 📄 License

AGPL-3.0
