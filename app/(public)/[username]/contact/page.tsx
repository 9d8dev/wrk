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
      <Section>
        <Container>
          <ContactForm userId={user.id} />
        </Container>
      </Section>
    </>
  );
}
