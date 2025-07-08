import { DeleteAccountButton } from "@/components/admin/delete-account-button";

export function DangerZone() {
  return (
    <div className="border-destructive/20 mt-12 border-t pt-8">
      <div className="space-y-4">
        <div>
          <h2 className="text-destructive text-lg font-semibold">
            Danger Zone
          </h2>
          <p className="text-muted-foreground text-sm">
            Once you delete your account, there is no going back. Please be
            certain.
          </p>
        </div>
        <DeleteAccountButton />
      </div>
    </div>
  );
}
