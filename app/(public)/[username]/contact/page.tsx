import { getUserByUsername } from "@/lib/data/user";
import { notFound } from "next/navigation";

import { Container, Section } from "@/components/ds";
import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileFooter } from "@/components/profile/profile-footer";
import { ContactForm } from "@/components/profile/contact-form";

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
      <ProfileFooter username={username} />
    </>
  );
}
