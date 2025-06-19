import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  json,
  integer,
  unique,
} from "drizzle-orm/pg-core";

// USER TABLE

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  username: text("username").unique().notNull(),
  displayUsername: text("display_username"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  // Polar subscription fields
  polarCustomerId: text("polar_customer_id"),
  subscriptionStatus: text("subscription_status"), // active, canceled, past_due, etc.
  subscriptionId: text("subscription_id"),
  subscriptionProductId: text("subscription_product_id"),
  subscriptionCurrentPeriodEnd: timestamp("subscription_current_period_end"),
  // Custom domain fields (Pro only)
  customDomain: text("custom_domain").unique(),
  domainStatus: text("domain_status"), // pending, active, error, null
  domainVerifiedAt: timestamp("domain_verified_at"),
});

// SUBSCRIPTION HISTORY TABLE

export const subscriptionEventTypes = [
  "created",
  "activated",
  "canceled",
  "uncanceled",
  "revoked",
  "updated",
  "payment_succeeded",
  "payment_failed",
] as const;

export const subscriptionHistory = pgTable("subscription_history", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  subscriptionId: text("subscription_id").notNull(),
  eventType: text("event_type", { enum: subscriptionEventTypes }).notNull(),
  eventData: json("event_data"), // Store the full webhook payload
  createdAt: timestamp("created_at").notNull(),
});

export const subscriptionHistoryRelations = relations(
  subscriptionHistory,
  ({ one }) => ({
    user: one(user, {
      fields: [subscriptionHistory.userId],
      references: [user.id],
    }),
  })
);

// MEDIA TABLE

export const media = pgTable("media", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  width: integer("width").notNull(),
  height: integer("height").notNull(),
  alt: text("alt"),
  size: integer("size"),
  mimeType: text("mime_type"),
  projectId: text("project_id"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const mediaRelations = relations(media, ({ one }) => ({
  project: one(project, {
    fields: [media.projectId],
    references: [project.id],
    relationName: "projectMedia",
  }),
  profile: one(profile, {
    fields: [media.id],
    references: [profile.profileImageId],
    relationName: "profileImage",
  }),
}));

// THEME TABLE

export const gridTypes = ["masonry", "grid", "minimal", "square"] as const;

export const theme = pgTable("theme", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  gridType: text("grid_type", { enum: gridTypes }).notNull().default("masonry"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const themeRelations = relations(theme, ({ one }) => ({
  user: one(user, {
    fields: [theme.userId],
    references: [user.id],
  }),
}));

// PROJECT TABLE

export const project = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    about: text("about"),
    slug: text("slug").notNull(),
    externalLink: text("external_link"),
    featuredImageId: text("featured_image_id"),
    imageIds: json("image_ids").$type<string[]>().default([]),
    displayOrder: integer("display_order").default(0),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => ({
    uniqueSlugPerUser: unique().on(table.slug, table.userId),
  })
);

export const projectRelations = relations(project, ({ one, many }) => ({
  user: one(user, {
    fields: [project.userId],
    references: [user.id],
  }),
  media: many(media, { relationName: "projectMedia" }),
  featuredImage: one(media, {
    fields: [project.featuredImageId],
    references: [media.id],
    relationName: "projectFeaturedImage",
  }),
}));

// PROFILE TABLE

export const profile = pgTable("profile", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  title: text("title"),
  bio: text("bio"),
  location: text("location"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  profileImageId: text("profile_image_id").references(() => media.id, {
    onDelete: "cascade",
  }),
});

export const profileRelations = relations(profile, ({ one, many }) => ({
  user: one(user, {
    fields: [profile.userId],
    references: [user.id],
  }),
  profileImage: one(media, {
    fields: [profile.profileImageId],
    references: [media.id],
    relationName: "profileImage",
  }),
  socialLinks: many(socialLink),
}));

// SOCIAL LINK TABLE

export const socialLink = pgTable("social_link", {
  id: text("id").primaryKey(),
  profileId: text("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  platform: text("platform").notNull(),
  url: text("url").notNull(),
  displayOrder: integer("display_order").default(0),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const socialLinkRelations = relations(socialLink, ({ one }) => ({
  profile: one(profile, {
    fields: [socialLink.profileId],
    references: [profile.id],
  }),
}));

// LEADS TABLE

export const leadStatuses = [
  "new",
  "contacted",
  "resolved",
  "archived",
] as const;

export const lead = pgTable("lead", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  message: text("message").notNull(),
  status: text("status", { enum: leadStatuses }).notNull().default("new"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const leadRelations = relations(lead, ({ one }) => ({
  user: one(user, {
    fields: [lead.userId],
    references: [user.id],
  }),
}));

// SESSION TABLE

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

// ACCOUNT TABLE

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

// VERIFICATION TABLE

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

// Type Exports
export type Project = typeof project.$inferSelect;
export type Profile = typeof profile.$inferSelect;
export type User = typeof user.$inferSelect;
export type Session = typeof session.$inferSelect;
export type Account = typeof account.$inferSelect;
export type VerificationToken = typeof verification.$inferSelect;
export type Media = typeof media.$inferSelect;
export type SocialLink = typeof socialLink.$inferSelect;
export type Theme = typeof theme.$inferSelect;
export type Lead = typeof lead.$inferSelect;
export type SubscriptionHistory = typeof subscriptionHistory.$inferSelect;
