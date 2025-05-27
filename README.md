# Wrk.so - Showcase Your Creative Work

Wrk.so is a modern platform designed for creatives of all kinds – artists, designers, developers, writers, and more – to effortlessly build and share stunning online portfolios. Showcase your projects, connect with potential clients or employers, and manage your creative presence all in one place.

## Key Features

*   **Effortless Portfolio Creation:** Quickly build and customize your online portfolio to reflect your unique brand.
*   **Project Showcases:** Add detailed descriptions, images, and other media to showcase your best work.
*   **Public Profile Pages:** Get a unique link to your personal portfolio page (e.g., `wrk.so/yourname`).
*   **Contact & Lead Management:** Allow visitors to contact you directly through your profile, with leads accessible via the admin dashboard.
*   **Admin Dashboard:** A comprehensive dashboard to manage your profile, projects, themes, and leads.
*   **Theme Customization:** Personalize the look and feel of your portfolio.
*   **Secure Authentication:** Easy and secure sign-up and login.
*   **Media Uploads:** Support for uploading various media types for your projects.

## Tech Stack

Wrk.so is built with a modern and robust technology stack:

*   **Framework:** [Next.js](https://nextjs.org/) (using Turbopack for development)
*   **Language:** [TypeScript](https://www.typescriptlang.org/)
*   **UI Framework:** [React](https://reactjs.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)
*   **Component Library:** [Shadcn UI](https://ui.shadcn.com/) (built on Radix UI)
*   **State Management:** React Context/Hooks (inferred, common with Next.js)
*   **Forms:** [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) for validation
*   **Database ORM:** [Drizzle ORM](https://orm.drizzle.team/)
*   **Database:** [PostgreSQL](https://www.postgresql.org/) (specifically with [Neon Serverless Postgres](https://neon.tech/))
*   **Authentication:** [Better Auth](https://betterauth.dev/) (likely, based on dependency)
*   **File Uploads:** [React Dropzone](https://react-dropzone.js.org/) with [AWS S3](https://aws.amazon.com/s3/) for storage
*   **Drag & Drop:** [DND Kit](https://dndkit.com/)
*   **API Routes:** Next.js API Routes
*   **Deployment:** (Assumed Vercel, given Next.js and `@vercel/analytics`)
*   **Package Manager:** [pnpm](https://pnpm.io/)
*   **Linting:** [ESLint](https://eslint.org/)

This provides a solid foundation for a scalable and maintainable platform.

## Getting Started

Follow these steps to set up the Wrk.so development environment locally:

1.  **Clone the Repository:**
    ```bash
    git clone <repository-url> # Replace <repository-url> with the actual URL
    cd wrk-so # Or your project's directory name
    ```

2.  **Install Dependencies:**
    This project uses [pnpm](https://pnpm.io/) as the package manager.
    ```bash
    pnpm install
    ```
    This command installs all the necessary project dependencies.

3.  **Set Up Environment Variables:**
    Create a `.env.local` file in the root of the project by copying the example file:
    ```bash
    cp .env.example .env.local
    ```
    Then, update `.env.local` with your actual credentials and configuration for services like:
    *   Database (Neon/PostgreSQL connection string)
    *   Authentication (Better Auth credentials)
    *   AWS S3 (for file uploads)
    *   Any other services listed in `.env.example`.

4.  **Database Setup:**
    This project uses Drizzle ORM for database interactions.
    *   **Generate Schema:** (If you make changes to the Drizzle schema located in `db/schema.ts`)
        ```bash
        pnpm db:generate
        ```
        This command generates SQL migration files based on your schema changes.
    *   **Apply Migrations:**
        ```bash
        pnpm db:migrate
        ```
        This command applies any pending migrations to your database, setting up the required tables and columns.

5.  **Run the Development Server:**
    ```bash
    pnpm dev
    ```
    This command starts the Next.js development server (usually on `http://localhost:3000`). The `--turbopack` flag is used for faster development builds.

You should now have Wrk.so running locally!
