export const AdminHeader = ({
  children,
  pageTitle,
}: {
  children?: React.ReactNode;
  pageTitle: string;
}) => {
  return (
    <div className="bg-muted sticky top-0 z-10 flex h-12 items-center justify-between border-b border-dashed px-4">
      <h2 className="font-medium">{pageTitle}</h2>
      {children}
    </div>
  );
};
