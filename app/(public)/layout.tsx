export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="bg-accent/30 min-w-screen min-h-screen">{children}</main>
  );
}
