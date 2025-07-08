"use client";

import { deleteAccount } from "@/lib/actions/auth";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export const DeleteAccountButton = () => {
	const [isDeleting, setIsDeleting] = useState(false);
	const [isOpen, setIsOpen] = useState(false);
	const router = useRouter();

	const handleDeleteAccount = async () => {
		try {
			setIsDeleting(true);

			const result = await deleteAccount();

			if (result.success) {
				toast.success("Account deleted successfully. Redirecting...");
				// Give a moment for the toast to show, then redirect
				setTimeout(() => {
					router.push("/");
				}, 1000);
			} else {
				toast.error(result.error || "Failed to delete account");
			}
		} catch (error) {
			console.error("Error deleting account:", error);
			toast.error("Failed to delete account");
		} finally {
			setIsDeleting(false);
			setIsOpen(false);
		}
	};

	return (
		<AlertDialog open={isOpen} onOpenChange={setIsOpen}>
			<AlertDialogTrigger asChild>
				<Button variant="destructive" size="default">
					<Trash2 className="w-4 h-4 mr-2" />
					Delete Account
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle className="flex items-center gap-2">
						<AlertTriangle className="w-5 h-5 text-destructive" />
						Delete Account
					</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete your
						account and remove all of your data from our servers.
					</AlertDialogDescription>
				</AlertDialogHeader>

				<Alert variant="destructive">
					<AlertTriangle className="h-4 w-4" />
					<AlertDescription>
						<strong>This will permanently delete:</strong>
						<ul className="mt-2 space-y-1 list-disc list-inside">
							<li>Your profile and all personal information</li>
							<li>All your projects and their content</li>
							<li>All uploaded images and media files</li>
							<li>Your subscription (if active)</li>
							<li>All contact form submissions</li>
							<li>Your account settings and preferences</li>
						</ul>
					</AlertDescription>
				</Alert>

				<AlertDialogFooter>
					<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleDeleteAccount}
						disabled={isDeleting}
						className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
					>
						{isDeleting ? "Deleting..." : "Delete Account"}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};
