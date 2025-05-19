import { getUserByUsername } from "@/lib/data/user";
import { notFound } from "next/navigation";

import { Container, Section } from "@/components/ds";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ContactForm } from "@/components/profile/contact-form";
import { Mail } from "lucide-react";

export default async function ContactPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const user = await getUserByUsername(username);

  if (!user) {
    return notFound();
  }

  return (
    <>
      <ProfileHeader username={username} />
      <Section className="py-16">
        <Container className="max-w-4xl">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-5 w-5 text-primary" />
                <h1 className="text-2xl font-bold">Get in Touch</h1>
              </div>
              <p className="text-muted-foreground mb-6">
                Have a question or want to work together? Fill out the form and
                I&apos;ll get back to you as soon as possible.
              </p>
              <div className="bg-muted p-6 rounded-lg">
                <h2 className="text-lg font-medium mb-3">
                  Contact Information
                </h2>
                <p className="text-sm text-muted-foreground mb-1">
                  <span className="font-medium">Name:</span>{" "}
                  {user.name || username}
                </p>
                {user.email && (
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                )}
              </div>
            </div>
            <div className="bg-card p-6 rounded-lg border shadow-sm">
              <ContactForm userId={user.id} />
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
