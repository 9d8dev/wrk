"use client";

import { formatDistanceToNow } from "date-fns";
import {
	Archive,
	Check,
	Clock,
	ExternalLink,
	Mail,
	MessageCircle,
	MoreHorizontal,
	RefreshCw,
	Trash2,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type Lead, leadStatuses } from "@/db/schema";
import {
	deleteLead,
	getLeadsByUserId,
	updateLeadStatus,
} from "@/lib/actions/leads";
import { cn } from "@/lib/utils";

type LeadsListProps = {
	userId: string;
	leads: Lead[];
};

// Status configuration
const statusConfig = {
	new: {
		label: "New",
		icon: Clock,
		color:
			"bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800",
		dot: "bg-blue-500",
	},
	contacted: {
		label: "Contacted",
		icon: Mail,
		color:
			"bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800",
		dot: "bg-amber-500",
	},
	resolved: {
		label: "Resolved",
		icon: Check,
		color:
			"bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800",
		dot: "bg-green-500",
	},
	archived: {
		label: "Archived",
		icon: Archive,
		color:
			"bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800",
		dot: "bg-gray-500",
	},
} as const;

export function LeadsList({ userId, leads: initialLeads }: LeadsListProps) {
	const [leads, setLeads] = useState<Lead[]>(initialLeads);
	const [isUpdating, setIsUpdating] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState<string | null>(null);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const [expandedLead, setExpandedLead] = useState<string | null>(null);

	const refreshLeads = useCallback(async () => {
		try {
			setIsRefreshing(true);
			const freshLeads = await getLeadsByUserId(userId);
			setLeads(freshLeads);
			toast.success("Leads refreshed");
		} catch (error) {
			console.error("Error refreshing leads:", error);
			toast.error("Failed to refresh leads");
		} finally {
			setIsRefreshing(false);
		}
	}, [userId]);

	const handleStatusUpdate = async (
		leadId: string,
		status: (typeof leadStatuses)[number],
	) => {
		try {
			setIsUpdating(leadId);
			await updateLeadStatus(leadId, status);

			setLeads(
				leads.map((lead) =>
					lead.id === leadId
						? { ...lead, status, updatedAt: new Date() }
						: lead,
				),
			);

			toast.success(`Status updated to ${status}`);
		} catch (error) {
			console.error("Error updating lead status:", error);
			toast.error("Failed to update status");
		} finally {
			setIsUpdating(null);
		}
	};

	const handleDelete = async (leadId: string) => {
		try {
			setIsDeleting(leadId);
			await deleteLead(leadId);

			setLeads(leads.filter((lead) => lead.id !== leadId));
			toast.success("Lead deleted");
		} catch (error) {
			console.error("Error deleting lead:", error);
			toast.error("Failed to delete lead");
		} finally {
			setIsDeleting(null);
		}
	};

	const handleEmailClick = (email: string) => {
		window.open(`mailto:${email}`, "_blank");
	};

	const toggleExpanded = (leadId: string) => {
		setExpandedLead(expandedLead === leadId ? null : leadId);
	};

	if (leads.length === 0) {
		return (
			<div className="text-center py-16">
				<MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
				<h3 className="text-lg font-semibold mb-2">No leads yet</h3>
				<p className="text-muted-foreground mb-6 max-w-md mx-auto">
					When someone contacts you through your portfolio contact form, their
					messages will appear here.
				</p>
				<Button
					variant="outline"
					onClick={refreshLeads}
					disabled={isRefreshing}
				>
					{isRefreshing ? (
						<>
							<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
							Checking for leads...
						</>
					) : (
						<>
							<RefreshCw className="mr-2 h-4 w-4" />
							Check for leads
						</>
					)}
				</Button>
			</div>
		);
	}

	// Sort leads by status priority and date
	const sortedLeads = [...leads].sort((a, b) => {
		const statusPriority = { new: 0, contacted: 1, resolved: 2, archived: 3 };
		const aPriority =
			statusPriority[a.status as keyof typeof statusPriority] ?? 4;
		const bPriority =
			statusPriority[b.status as keyof typeof statusPriority] ?? 4;

		if (aPriority !== bPriority) {
			return aPriority - bPriority;
		}

		return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
	});

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<h2 className="text-xl font-semibold">Leads ({leads.length})</h2>
					<p className="text-sm text-muted-foreground">
						Manage messages from your portfolio contact form
					</p>
				</div>
				<Button
					variant="outline"
					size="sm"
					onClick={refreshLeads}
					disabled={isRefreshing}
				>
					{isRefreshing ? (
						<>
							<RefreshCw className="mr-2 h-4 w-4 animate-spin" />
							Refreshing...
						</>
					) : (
						<>
							<RefreshCw className="mr-2 h-4 w-4" />
							Refresh
						</>
					)}
				</Button>
			</div>

			<div className="space-y-3">
				{sortedLeads.map((lead) => {
					const config = statusConfig[lead.status as keyof typeof statusConfig];
					const StatusIcon = config.icon;
					const isExpanded = expandedLead === lead.id;
					const isLoading = isUpdating === lead.id || isDeleting === lead.id;

					return (
						<div
							key={lead.id}
							className={cn(
								"border rounded-lg p-4 transition-all",
								isExpanded ? "ring-2 ring-primary/20" : "hover:bg-muted/50",
							)}
						>
							<div className="flex items-start justify-between gap-4">
								<div className="flex-1 min-w-0">
									<div className="flex items-center gap-3 mb-2">
										<div className={cn("w-2 h-2 rounded-full", config.dot)} />
										<h3 className="font-medium truncate">{lead.name}</h3>
										<Badge
											variant="outline"
											className={cn("text-xs", config.color)}
										>
											<StatusIcon className="w-3 h-3 mr-1" />
											{config.label}
										</Badge>
									</div>

									<div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
										<button
											onClick={() => handleEmailClick(lead.email)}
											className="flex items-center gap-1 hover:text-primary transition-colors"
										>
											<Mail className="w-3 h-3" />
											{lead.email}
											<ExternalLink className="w-3 h-3" />
										</button>
										<span>•</span>
										<span>
											{formatDistanceToNow(new Date(lead.createdAt), {
												addSuffix: true,
											})}
										</span>
									</div>

									<div className="space-y-2">
										<button
											onClick={() => toggleExpanded(lead.id)}
											className="text-left w-full"
										>
											<p
												className={cn(
													"text-sm",
													isExpanded ? "" : "line-clamp-2",
												)}
											>
												{lead.message}
											</p>
											{lead.message.length > 100 && (
												<span className="text-xs text-primary hover:underline mt-1 inline-block">
													{isExpanded ? "Show less" : "Read more"}
												</span>
											)}
										</button>
									</div>
								</div>

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" size="icon" disabled={isLoading}>
											<MoreHorizontal className="h-4 w-4" />
											<span className="sr-only">Actions</span>
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-48">
										<DropdownMenuItem
											onClick={() => handleEmailClick(lead.email)}
										>
											<Mail className="mr-2 h-4 w-4" />
											Reply via email
										</DropdownMenuItem>

										<DropdownMenuSeparator />

										{leadStatuses
											.filter((status) => status !== lead.status)
											.map((status) => {
												const statusConf =
													statusConfig[status as keyof typeof statusConfig];
												const StatusIcon = statusConf.icon;
												return (
													<DropdownMenuItem
														key={status}
														onClick={() => handleStatusUpdate(lead.id, status)}
													>
														<StatusIcon className="mr-2 h-4 w-4" />
														Mark as {statusConf.label}
													</DropdownMenuItem>
												);
											})}

										<DropdownMenuSeparator />

										<DropdownMenuItem
											className="text-destructive"
											onClick={() => handleDelete(lead.id)}
										>
											<Trash2 className="mr-2 h-4 w-4" />
											Delete lead
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
