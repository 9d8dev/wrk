export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="max-w-screen min-h-screen overflow-x-hidden">
      {children}
    </main>
  );
}
