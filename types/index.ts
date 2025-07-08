import type { media, profile, project, socialLink, user } from "@/db/schema";

export type Project = typeof project.$inferSelect;
export type Media = typeof media.$inferSelect;
export type User = typeof user.$inferSelect;
export type Profile = typeof profile.$inferSelect;
export type SocialLink = typeof socialLink.$inferSelect;

export interface ProjectWithMedia extends Project {
  featuredMedia?: Media;
  additionalMedia?: Media[];
}
