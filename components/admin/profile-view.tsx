"use client";

import { Edit } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";

import type { Profile, SocialLink } from "@/types";

type SessionUser = {
  id: string;
  name?: string | null;
  username?: string | null;
  email: string;
  image?: string | null;
};

interface ProfileViewProps {
  user: SessionUser;
  profile: Profile | null;
  socialLinks: SocialLink[];
  profileImageUrl?: string;
  onEdit: () => void;
}

export default function ProfileView({
  user,
  profile,
  socialLinks,
  profileImageUrl,
  onEdit,
}: ProfileViewProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your public profile information
          </p>
        </div>
        <Button type="button" variant="outline" onClick={onEdit}>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </div>

      <div className="space-y-8">
        <div className="flex items-center space-x-4">
          {profileImageUrl && (
            <div className="bg-muted h-20 w-20 overflow-hidden rounded-full">
              <Image
                src={profileImageUrl}
                alt={user.name || "Profile"}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold">{user.name || "—"}</h2>
            {profile?.title && (
              <p className="text-muted-foreground text-sm">{profile.title}</p>
            )}
            <p className="text-muted-foreground">@{user.username || "—"}</p>
          </div>
        </div>

        <div className="grid gap-6">
          <div>
            <h3 className="mb-2 font-medium">Contact</h3>
            <div className="space-y-2">
              <p className="text-muted-foreground text-sm">Email</p>
              <p>{user.email}</p>
            </div>
          </div>

          {(profile?.bio || profile?.location) && (
            <div>
              <h3 className="mb-2 font-medium">About</h3>
              <div className="space-y-4">
                {profile?.bio && (
                  <div>
                    <p className="text-muted-foreground text-sm">Bio</p>
                    <p className="whitespace-pre-wrap">{profile.bio}</p>
                  </div>
                )}
                {profile?.location && (
                  <div>
                    <p className="text-muted-foreground text-sm">Location</p>
                    <p>{profile.location}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {socialLinks.length > 0 && (
            <div>
              <h3 className="mb-2 font-medium">Social Links</h3>
              <div className="space-y-2">
                {socialLinks.map((link) => (
                  <div key={`${link.platform}-${link.url}`}>
                    <p className="text-muted-foreground text-sm">
                      {link.platform}
                    </p>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline dark:text-blue-400"
                    >
                      {link.url}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="text-muted-foreground text-xs">
          Press <kbd className="bg-muted rounded px-1 py-0.5">E</kbd> to edit
        </div>
      </div>
    </div>
  );
}
