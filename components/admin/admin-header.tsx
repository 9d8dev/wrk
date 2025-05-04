export const AdminHeader = ({
  children,
  pageTitle,
}: {
  children?: React.ReactNode;
  pageTitle: string;
}) => {
  return (
    <div className="sticky top-0 flex justify-between h-12 border-b border-dashed items-center bg-muted px-4">
      <h2 className="font-medium">{pageTitle}</h2>
      {children}
    </div>
  );
};
