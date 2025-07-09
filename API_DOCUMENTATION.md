# API Documentation - Wrk.so Portfolio Platform

This document provides comprehensive documentation for all public APIs, functions, and components in the Wrk.so portfolio platform.

## Table of Contents

1. [Authentication System](#authentication-system)
2. [Database Schema](#database-schema)
3. [API Routes](#api-routes)
4. [Server Actions](#server-actions)
5. [React Components](#react-components)
6. [Custom Hooks](#custom-hooks)
7. [Utilities & Helpers](#utilities--helpers)
8. [Data Layer](#data-layer)
9. [TypeScript Types](#typescript-types)

---

## Authentication System

### Auth Configuration (`lib/auth.ts`)

The authentication system uses Better Auth with OAuth providers and email/password authentication.

#### `auth` - Main Authentication Instance

```typescript
import { auth } from "@/lib/auth";

// Usage in API routes
const session = await auth.api.getSession({ headers: await headers() });

// Usage in components
const { data: session } = await auth.api.getSession();
```

**Features:**

- GitHub OAuth
- Google OAuth
- Email/password authentication
- Username validation with reserved username protection
- Polar integration for subscriptions
- 30-day session duration

**Environment Variables Required:**

```env
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
POLAR_ACCESS_TOKEN=your_polar_access_token
POLAR_WEBHOOK_SECRET=your_polar_webhook_secret
BETTER_AUTH_URL=your_app_url
```

### Auth Client (`lib/auth-client.ts`)

Client-side authentication utilities.

#### `authClient` - Client Authentication Instance

```typescript
import { authClient, signIn, signUp, useSession } from "@/lib/auth-client";

// Sign in
await signIn.email({
  email: "user@example.com",
  password: "password123",
});

// Sign up
await signUp.email({
  email: "user@example.com",
  password: "password123",
  name: "John Doe",
});

// Use session hook
const { data: session, isLoading } = useSession();
```

---

## Database Schema

### Core Tables (`db/schema.ts`)

#### User Table

```typescript
// Type definition
type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string;
  username: string;
  displayUsername?: string;
  createdAt: Date;
  updatedAt: Date;
  // Subscription fields
  polarCustomerId?: string;
  subscriptionStatus?: string;
  subscriptionId?: string;
  subscriptionProductId?: string;
  subscriptionCurrentPeriodEnd?: Date;
  // Custom domain fields (Pro only)
  customDomain?: string;
  domainStatus?:
    | "pending"
    | "dns_configured"
    | "vercel_pending"
    | "ssl_pending"
    | "active"
    | "error";
  domainErrorMessage?: string;
  domainVerifiedAt?: Date;
};
```

#### Project Table

```typescript
// Type definition
type Project = {
  id: string;
  title: string;
  about?: string;
  slug: string;
  externalLink?: string;
  featuredImageId?: string;
  imageIds: string[];
  displayOrder: number;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
};
```

#### Profile Table

```typescript
// Type definition
type Profile = {
  id: string;
  userId: string;
  title?: string;
  bio?: string;
  location?: string;
  profileImageId?: string;
  createdAt: Date;
  updatedAt: Date;
};
```

#### Media Table

```typescript
// Type definition
type Media = {
  id: string;
  url: string;
  width: number;
  height: number;
  alt?: string;
  size?: number;
  mimeType?: string;
  projectId?: string;
  createdAt: Date;
  updatedAt: Date;
};
```

#### Theme Table

```typescript
// Type definition
type Theme = {
  id: string;
  userId: string;
  gridType: "masonry" | "grid" | "minimal" | "square";
  createdAt: Date;
  updatedAt: Date;
};
```

---

## API Routes

### Authentication (`app/api/auth/[...all]/route.ts`)

```typescript
// Auto-handled by Better Auth
export const { GET, POST } = toNextJsHandler(auth.handler);
```

**Endpoints:**

- `POST /api/auth/sign-in` - Email/password sign in
- `POST /api/auth/sign-up` - Email/password sign up
- `GET /api/auth/session` - Get current session
- `POST /api/auth/sign-out` - Sign out user
- `GET /api/auth/callback/github` - GitHub OAuth callback
- `GET /api/auth/callback/google` - Google OAuth callback

### Upload API (`app/api/upload/route.ts`)

Direct file upload endpoint with authentication and validation.

```typescript
// POST /api/upload
const formData = new FormData();
formData.append("file", file);
formData.append("projectId", "optional-project-id");

const response = await fetch("/api/upload", {
  method: "POST",
  body: formData,
});

const result = await response.json();
// Returns: { success: boolean, mediaId?: string, url?: string, error?: string }
```

**Features:**

- File size limit: 20MB
- Supported formats: JPEG, PNG, WebP, GIF
- Automatic image optimization
- R2/S3 storage integration
- Project association

### Upload Presigned URL (`app/api/upload/presigned/route.ts`)

Generate presigned URLs for client-side uploads.

```typescript
// POST /api/upload/presigned
const response = await fetch("/api/upload/presigned", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    fileName: "image.jpg",
    fileType: "image/jpeg",
    fileSize: 1024000,
  }),
});

const { presignedUrl, fields } = await response.json();
```

### Media API (`app/api/media/route.ts`)

Media management endpoint.

```typescript
// DELETE /api/media
const response = await fetch("/api/media", {
  method: "DELETE",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ mediaId: "media-id" }),
});
```

---

## Server Actions

### Profile Actions (`lib/actions/profile.ts`)

#### `updateProfile(params: UpdateProfileParams)`

Update user profile with validation.

```typescript
import { updateProfile } from "@/lib/actions/profile";

const result = await updateProfile({
  profileData: {
    title: "Senior Designer",
    bio: "Passionate about creating beautiful digital experiences.",
    location: "San Francisco, CA",
  },
  userData: {
    name: "John Doe",
    username: "johndoe",
    email: "john@example.com",
  },
  socialLinks: [
    { platform: "twitter", url: "https://twitter.com/johndoe" },
    { platform: "linkedin", url: "https://linkedin.com/in/johndoe" },
  ],
  profileImageFormData: formData, // Optional
});

if (result.success) {
  console.log("Profile updated:", result.data);
} else {
  console.error("Error:", result.error);
}
```

#### `createProfile(params: CreateProfileParams)`

Create a new profile for authenticated user.

```typescript
import { createProfile } from "@/lib/actions/profile";

const result = await createProfile({
  profileData: {
    title: "Designer",
    bio: "Hello world!",
    location: "New York",
  },
  username: "newusername", // Optional username change
});
```

#### `updateUsername(newUsername: string)`

Update username with validation and availability check.

```typescript
import { updateUsername } from "@/lib/actions/profile";

const result = await updateUsername("newusername");
```

### Project Actions (`lib/actions/project.ts`)

#### `createProject(data: ProjectData)`

Create a new project with automatic slug generation.

```typescript
import { createProject } from "@/lib/actions/project";

const result = await createProject({
  title: "My Awesome Project",
  about: "A detailed description of my project.",
  externalLink: "https://example.com",
  imageIds: ["media-id-1", "media-id-2"],
  featuredImageId: "media-id-1",
});

if (result.success) {
  console.log("Project created:", result.data);
  // { id: 'project-id', slug: 'my-awesome-project', title: 'My Awesome Project' }
}
```

#### `updateProject(id: string, data: Partial<ProjectData>)`

Update an existing project with ownership validation.

```typescript
import { updateProject } from "@/lib/actions/project";

const result = await updateProject("project-id", {
  title: "Updated Project Title",
  about: "Updated description",
});
```

#### `deleteProject(id: string)`

Delete a project and associated media.

```typescript
import { deleteProject } from "@/lib/actions/project";

const result = await deleteProject("project-id");
```

#### `updateProjectOrder(projectIds: string[])`

Reorder projects by providing array of project IDs in desired order.

```typescript
import { updateProjectOrder } from "@/lib/actions/project";

const result = await updateProjectOrder([
  "project-id-3",
  "project-id-1",
  "project-id-2",
]);
```

### Media Actions (`lib/actions/media.ts`)

#### `uploadImage(formData: FormData, projectId?: string)`

Upload image with automatic optimization and validation.

```typescript
import { uploadImage } from "@/lib/actions/media";

const formData = new FormData();
formData.append("file", file);

const result = await uploadImage(formData, "optional-project-id");

if (result.success) {
  console.log("Image uploaded:", result.mediaId);
}
```

### AI Actions (`lib/actions/ai.ts`)

#### `generateDescription(imageUrl: string)`

Generate AI description for images using Groq.

```typescript
import { generateDescription } from "@/lib/actions/ai";

const result = await generateDescription("https://example.com/image.jpg");

if (result.success) {
  console.log("Generated description:", result.data);
}
```

### Authentication Actions (`lib/actions/auth.ts`)

#### `getSession()`

Get current user session.

```typescript
import { getSession } from "@/lib/actions/auth";

const session = await getSession();
if (session) {
  console.log("User:", session.user);
}
```

#### `signOut()`

Sign out current user.

```typescript
import { signOut } from "@/lib/actions/auth";

await signOut(); // Redirects to sign-in page
```

#### `deleteAccount()`

Delete user account and all associated data.

```typescript
import { deleteAccount } from "@/lib/actions/auth";

const result = await deleteAccount();
```

---

## React Components

### UI Components (`components/ui/`)

#### `Button`

Flexible button component with variants.

```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="md">
  Click me
</Button>

<Button variant="outline" size="sm">
  Secondary
</Button>

<Button variant="destructive" size="lg">
  Delete
</Button>
```

**Props:**

- `variant`: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
- `size`: 'default' | 'sm' | 'lg' | 'icon'

#### `Input`

Form input component with validation states.

```tsx
import { Input } from '@/components/ui/input';

<Input
  type="text"
  placeholder="Enter your name"
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>

<Input
  type="email"
  placeholder="Email"
  error="Invalid email"
/>
```

#### `FileUploader`

Drag-and-drop file upload component.

```tsx
import {
  FileUploader,
  FileUploaderContent,
  FileUploaderItem,
} from "@/components/ui/file-upload";

<FileUploader
  value={files}
  onValueChange={setFiles}
  dropzoneOptions={{
    accept: { "image/*": [".jpg", ".jpeg", ".png", ".webp"] },
    maxSize: 20 * 1024 * 1024, // 20MB
  }}
>
  <FileUploaderContent>
    {files.map((file, index) => (
      <FileUploaderItem key={index} index={index}>
        {file.name}
      </FileUploaderItem>
    ))}
  </FileUploaderContent>
</FileUploader>;
```

#### `AsyncImage`

Optimized image component with loading states.

```tsx
import { AsyncImage } from "@/components/ui/async-image";

<AsyncImage
  src="/path/to/image.jpg"
  alt="Description"
  width={400}
  height={300}
  className="rounded-lg"
/>;
```

### Profile Components (`components/profile/`)

#### `PortfolioGrid`

Main portfolio grid component with multiple layout options.

```tsx
import { PortfolioGrid } from "@/components/profile/portfolio-grid";

<PortfolioGrid projects={projects} username="johndoe" gridType="masonry" />;
```

**Grid Types:**

- `masonry` - Pinterest-style variable heights
- `grid` - Standard uniform grid
- `minimal` - Clean minimal layout
- `square` - Instagram-style square grid

#### `ContactForm`

Lead generation contact form.

```tsx
import { ContactForm } from "@/components/profile/contact-form";

<ContactForm userId="user-id" portfolioOwner="John Doe" />;
```

#### `ProfileHeader`

User profile header with avatar and basic info.

```tsx
import { ProfileHeader } from "@/components/profile/profile-header";

<ProfileHeader username="johndoe" />;
```

### Admin Components (`components/admin/`)

#### `ProjectForm`

Complete project creation/editing form.

```tsx
import { ProjectForm } from '@/components/admin/project-form';

<ProjectForm
  mode="create"
  onSuccess={(project) => console.log('Created:', project)}
  onCancel={() => setShowForm(false)}
/>

<ProjectForm
  mode="edit"
  project={existingProject}
  onSuccess={(project) => console.log('Updated:', project)}
/>
```

#### `ProfileForm`

Profile editing form with image upload.

```tsx
import { ProfileForm } from "@/components/admin/profile-form";

<ProfileForm
  user={user}
  profile={profile}
  onSuccess={() => console.log("Profile updated")}
/>;
```

#### `ThemeForm`

Theme customization form.

```tsx
import { ThemeForm } from "@/components/admin/theme-form";

<ThemeForm user={user} theme={theme} />;
```

### Authentication Components (`components/auth/`)

#### `SignInForm`

Complete sign-in form with validation.

```tsx
import SignInForm from "@/components/auth/sign-in-form";

<SignInForm />;
```

#### `SignUpForm`

Complete sign-up form with validation.

```tsx
import SignUpForm from "@/components/auth/sign-up-form";

<SignUpForm />;
```

#### `SocialLoginButtons`

OAuth login buttons for GitHub and Google.

```tsx
import SocialLoginButtons from "@/components/auth/social-login-buttons";

<SocialLoginButtons
  mode="signin" // or "signup"
  onSuccess={() => console.log("Logged in")}
/>;
```

---

## Custom Hooks

### Form Hooks (`hooks/`)

#### `useSignUpForm()`

Sign-up form state management with validation.

```tsx
import { useSignUpForm } from "@/hooks/use-sign-up-form";

function SignUpPage() {
  const { form, isLoading, passwordStrength, handleSubmit } = useSignUpForm();

  return (
    <form onSubmit={handleSubmit}>
      <input {...form.register("name")} />
      <input {...form.register("email")} />
      <input {...form.register("password")} />
      <input {...form.register("username")} />
      <button disabled={isLoading}>Sign Up</button>
    </form>
  );
}
```

#### `useSignInForm()`

Sign-in form state management.

```tsx
import { useSignInForm } from "@/hooks/use-sign-in-form";

function SignInPage() {
  const { form, isLoading, handleSubmit } = useSignInForm();

  return (
    <form onSubmit={handleSubmit}>
      <input {...form.register("email")} />
      <input {...form.register("password")} />
      <button disabled={isLoading}>Sign In</button>
    </form>
  );
}
```

#### `useProfileForm(initialData, onSuccess)`

Profile form with optimistic updates.

```tsx
import { useProfileForm } from "@/hooks/use-profile-form";

function ProfileEditPage() {
  const {
    form,
    isLoading,
    socialLinks,
    handleSubmit,
    addSocialLink,
    removeSocialLink,
  } = useProfileForm(initialProfile, (data) => {
    console.log("Profile saved:", data);
  });

  return <form onSubmit={handleSubmit}>{/* Form fields */}</form>;
}
```

### Utility Hooks

#### `useUsernameAvailability(username: string)`

Check username availability in real-time.

```tsx
import { useUsernameAvailability } from "@/hooks/use-username-availability";

function UsernameField() {
  const [username, setUsername] = useState("");
  const { isAvailable, isLoading, error } = useUsernameAvailability(username);

  return (
    <div>
      <input value={username} onChange={(e) => setUsername(e.target.value)} />
      {isLoading && <span>Checking...</span>}
      {!isLoading && username && (
        <span>{isAvailable ? "✓ Available" : "✗ Taken"}</span>
      )}
    </div>
  );
}
```

#### `usePasswordStrength(password: string)`

Password strength calculation.

```tsx
import { usePasswordStrength } from "@/hooks/use-password-strength";

function PasswordField() {
  const [password, setPassword] = useState("");
  const { score, feedback, isValid } = usePasswordStrength(password);

  return (
    <div>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <div>Strength: {score}/4</div>
      <div>{feedback}</div>
    </div>
  );
}
```

#### `useIsMobile()`

Mobile device detection.

```tsx
import { useIsMobile } from "@/hooks/use-mobile";

function ResponsiveComponent() {
  const isMobile = useIsMobile();

  return <div>{isMobile ? <MobileLayout /> : <DesktopLayout />}</div>;
}
```

---

## Utilities & Helpers

### Username Utilities (`lib/utils/username.ts`)

#### `cleanUsername(username: string)`

Clean and validate username format.

```typescript
import { cleanUsername } from "@/lib/utils/username";

const clean = cleanUsername("John Doe!"); // Returns: 'johndoe'
```

#### `generateUsernameFromEmail(email: string)`

Generate username from email address.

```typescript
import { generateUsernameFromEmail } from "@/lib/utils/username";

const username = generateUsernameFromEmail("john.doe@example.com"); // Returns: 'johndoe'
```

#### `generateUsernameFromName(name: string)`

Generate username from display name.

```typescript
import { generateUsernameFromName } from "@/lib/utils/username";

const username = generateUsernameFromName("John Doe"); // Returns: 'johndoe'
```

### Media Utilities (`lib/utils/media.ts`)

#### `detectImageType(src: string)`

Detect image type from URL or file extension.

```typescript
import { detectImageType } from "@/lib/utils/media";

const type = detectImageType("image.gif"); // Returns: 'gif'
```

#### `isAnimatedImage(src: string)`

Check if image is animated (GIF/WebP).

```typescript
import { isAnimatedImage } from "@/lib/utils/media";

const isAnimated = isAnimatedImage("animation.gif"); // Returns: true
```

#### `getImageLoadingSettings(src: string)`

Get optimized loading settings for images.

```typescript
import { getImageLoadingSettings } from "@/lib/utils/media";

const settings = getImageLoadingSettings("large-image.jpg");
// Returns: { loading: 'lazy', priority: false, quality: 85 }
```

### Subscription Utilities (`lib/utils/subscription.ts`)

#### `hasActiveSubscription(user: User)`

Check if user has active subscription.

```typescript
import { hasActiveSubscription } from "@/lib/utils/subscription";

const isActive = hasActiveSubscription(user);
```

#### `formatRenewalDate(date: Date)`

Format subscription renewal date for display.

```typescript
import { formatRenewalDate } from "@/lib/utils/subscription";

const formatted = formatRenewalDate(renewalDate); // Returns: 'December 25, 2024'
```

### Image Compression (`lib/utils/image-compression.ts`)

#### `compressImage(file: File, options?)`

Compress image file for optimization.

```typescript
import { compressImage } from "@/lib/utils/image-compression";

const compressedFile = await compressImage(originalFile, {
  maxSize: 1024 * 1024, // 1MB
  quality: 0.8,
});
```

---

## Data Layer

### User Data (`lib/data/user.ts`)

#### `getUserById(id: string)`

Get user by ID with caching.

```typescript
import { getUserById } from "@/lib/data/user";

const user = await getUserById("user-id");
```

#### `getUserByUsername(username: string)`

Get user by username with caching.

```typescript
import { getUserByUsername } from "@/lib/data/user";

const user = await getUserByUsername("johndoe");
```

#### `getUserByCustomDomain(domain: string)`

Get user by custom domain.

```typescript
import { getUserByCustomDomain } from "@/lib/data/user";

const user = await getUserByCustomDomain("johndoe.com");
```

### Project Data (`lib/data/project.ts`)

#### `getProjectsByUsername(username: string)`

Get all projects for a user with caching.

```typescript
import { getProjectsByUsername } from "@/lib/data/project";

const projects = await getProjectsByUsername("johndoe");
```

#### `getProjectByUsernameAndSlug(username: string, slug: string)`

Get specific project by username and slug.

```typescript
import { getProjectByUsernameAndSlug } from "@/lib/data/project";

const project = await getProjectByUsernameAndSlug("johndoe", "my-project");
```

#### `getProjectCount(userId: string)`

Get total project count for user.

```typescript
import { getProjectCount } from "@/lib/data/project";

const count = await getProjectCount("user-id");
```

### Profile Data (`lib/data/profile.ts`)

#### `getProfileByUsername(username: string)`

Get profile by username with social links.

```typescript
import { getProfileByUsername } from "@/lib/data/profile";

const profile = await getProfileByUsername("johndoe");
```

#### `getProfileByUserId(userId: string)`

Get profile by user ID.

```typescript
import { getProfileByUserId } from "@/lib/data/profile";

const profile = await getProfileByUserId("user-id");
```

### Media Data (`lib/data/media.ts`)

#### `getMediaById(id: string)`

Get media item by ID.

```typescript
import { getMediaById } from "@/lib/data/media";

const media = await getMediaById("media-id");
```

#### `getMediaByProjectId(projectId: string)`

Get all media for a project.

```typescript
import { getMediaByProjectId } from "@/lib/data/media";

const mediaList = await getMediaByProjectId("project-id");
```

---

## TypeScript Types

### Core Types (`types/index.ts`)

```typescript
// Extended project type with media
interface ProjectWithMedia extends Project {
  featuredMedia?: Media;
  additionalMedia?: Media[];
}

// User type from schema
type User = typeof user.$inferSelect;

// Project type from schema
type Project = typeof project.$inferSelect;

// Profile type from schema
type Profile = typeof profile.$inferSelect;

// Media type from schema
type Media = typeof media.$inferSelect;

// Social link type from schema
type SocialLink = typeof socialLink.$inferSelect;
```

### Validation Schemas (`lib/actions/schemas.ts`)

```typescript
// Sign up validation
const signUpSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_-]+$/),
});

// Project creation validation
const createProjectSchema = z.object({
  title: z.string().min(1).max(100),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  about: z.string().max(1000).optional(),
  externalLink: z.string().url().optional().or(z.literal("")),
  imageIds: z.array(z.string()).optional(),
  featuredImageId: z.string().optional(),
});

// Profile update validation
const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  title: z.string().max(100).optional(),
  bio: z.string().max(500).optional(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_-]+$/)
    .optional(),
  socialLinks: z
    .array(
      z.object({
        platform: z.string().min(1),
        url: z.string().url(),
        displayOrder: z.number().int().min(0),
      })
    )
    .optional(),
});
```

### Response Types

```typescript
// Standard API response format
type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Upload response
type UploadResponse = {
  success: boolean;
  mediaId?: string;
  url?: string;
  error?: string;
};

// Password strength response
type PasswordStrength = {
  score: number; // 0-4
  feedback: string;
  isValid: boolean;
};
```

---

## Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://...

# Authentication
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key

# OAuth Providers
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# File Storage (R2/S3)
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name
R2_PUBLIC_URL=https://your-r2-domain.com

# Payments (Polar)
POLAR_ACCESS_TOKEN=your-polar-access-token
POLAR_WEBHOOK_SECRET=your-polar-webhook-secret

# AI (Groq)
GROQ_API_KEY=your-groq-api-key

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Discord Notifications (Optional)
DISCORD_WEBHOOK_URL=your-discord-webhook-url

# Vercel (For custom domains)
VERCEL_ACCESS_TOKEN=your-vercel-token
VERCEL_TEAM_ID=your-team-id
```

---

## Error Handling

All server actions and API routes follow a consistent error handling pattern:

```typescript
// Success response
{
  success: true,
  data: { /* result data */ }
}

// Error response
{
  success: false,
  error: "Human-readable error message"
}
```

Common error scenarios:

- **Unauthorized**: User not authenticated
- **Validation Error**: Invalid input data
- **Not Found**: Resource doesn't exist
- **Conflict**: Duplicate username/slug
- **Rate Limited**: Too many requests
- **Server Error**: Internal server error

---

## Best Practices

1. **Authentication**: Always check session before modifying data
2. **Validation**: Use Zod schemas for all input validation
3. **Error Handling**: Provide meaningful error messages
4. **Caching**: Use cached data functions for read operations
5. **Revalidation**: Revalidate paths after data mutations
6. **File Uploads**: Validate file types and sizes
7. **Performance**: Use lazy loading for images
8. **Accessibility**: Include alt text for images
9. **SEO**: Generate proper meta tags for public pages
10. **Security**: Sanitize user input and validate ownership

---

This documentation covers all major APIs, functions, and components in the Wrk.so platform. For specific implementation details, refer to the individual source files in the codebase.
