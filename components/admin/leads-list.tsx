"use client";

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
import { formatDistanceToNow } from "date-fns";
import { useCallback, useState } from "react";
import { toast } from "sonner";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  deleteLead,
  getLeadsByUserId,
  updateLeadStatus,
} from "@/lib/actions/leads";
import { cn } from "@/lib/utils";

import { type Lead, leadStatuses } from "@/db/schema";

// Types
type LeadsListProps = {
  userId: string;
  leads: Lead[];
};

type StatusConfig = {
  label: string;
  icon: typeof Clock;
  color: string;
  dot: string;
};

type LeadItemProps = {
  lead: Lead;
  isExpanded: boolean;
  isLoading: boolean;
  onToggleExpanded: (leadId: string) => void;
  onEmailClick: (email: string) => void;
  onStatusUpdate: (
    leadId: string,
    status: (typeof leadStatuses)[number]
  ) => void;
  onDelete: (leadId: string) => void;
};

// Constants
const STATUS_CONFIG: Record<string, StatusConfig> = {
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

const STATUS_PRIORITY = { new: 0, contacted: 1, resolved: 2, archived: 3 };

// Utility functions
function sortLeads(leads: Lead[]): Lead[] {
  return [...leads].sort((a, b) => {
    const aPriority =
      STATUS_PRIORITY[a.status as keyof typeof STATUS_PRIORITY] ?? 4;
    const bPriority =
      STATUS_PRIORITY[b.status as keyof typeof STATUS_PRIORITY] ?? 4;

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

function openEmail(email: string) {
  window.open(`mailto:${email}`, "_blank");
}

// Custom hooks
function useLeadOperations(
  userId: string,
  leads: Lead[],
  setLeads: (leads: Lead[]) => void
) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

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
  }, [userId, setLeads]);

  const handleStatusUpdate = async (
    leadId: string,
    status: (typeof leadStatuses)[number]
  ) => {
    try {
      setIsUpdating(leadId);
      await updateLeadStatus(leadId, status);

      setLeads(
        leads.map((lead) =>
          lead.id === leadId ? { ...lead, status, updatedAt: new Date() } : lead
        )
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

  return {
    isUpdating,
    isDeleting,
    isRefreshing,
    refreshLeads,
    handleStatusUpdate,
    handleDelete,
  };
}

// Components
function LeadStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  const StatusIcon = config.icon;

  return (
    <Badge variant="outline" className={cn("text-xs", config.color)}>
      <StatusIcon className="mr-1 h-3 w-3" />
      {config.label}
    </Badge>
  );
}

function LeadMessage({
  message,
  isExpanded,
  onToggleExpanded,
}: {
  message: string;
  isExpanded: boolean;
  onToggleExpanded: () => void;
}) {
  const shouldShowToggle = message.length > 100;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onToggleExpanded}
        className="w-full text-left"
      >
        <p className={cn("text-sm", isExpanded ? "" : "line-clamp-2")}>
          {message}
        </p>
        {shouldShowToggle && (
          <span className="text-primary mt-1 inline-block text-xs hover:underline">
            {isExpanded ? "Show less" : "Read more"}
          </span>
        )}
      </button>
    </div>
  );
}

function LeadActionsMenu({
  lead,
  onEmailClick,
  onStatusUpdate,
  onDelete,
  isLoading,
}: {
  lead: Lead;
  onEmailClick: (email: string) => void;
  onStatusUpdate: (
    leadId: string,
    status: (typeof leadStatuses)[number]
  ) => void;
  onDelete: (leadId: string) => void;
  isLoading: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" disabled={isLoading}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">Actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => onEmailClick(lead.email)}>
          <Mail className="mr-2 h-4 w-4" />
          Reply via email
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {leadStatuses
          .filter((status) => status !== lead.status)
          .map((status) => {
            const statusConfig = STATUS_CONFIG[status];
            const StatusIcon = statusConfig.icon;
            return (
              <DropdownMenuItem
                key={status}
                onClick={() => onStatusUpdate(lead.id, status)}
              >
                <StatusIcon className="mr-2 h-4 w-4" />
                Mark as {statusConfig.label}
              </DropdownMenuItem>
            );
          })}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          className="text-destructive"
          onClick={() => onDelete(lead.id)}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete lead
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function LeadItem({
  lead,
  isExpanded,
  isLoading,
  onToggleExpanded,
  onEmailClick,
  onStatusUpdate,
  onDelete,
}: LeadItemProps) {
  const config = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;

  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-all",
        isExpanded ? "ring-primary/20 ring-2" : "hover:bg-muted/50"
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-center gap-3">
            <div className={cn("h-2 w-2 rounded-full", config.dot)} />
            <h3 className="truncate font-medium">{lead.name}</h3>
            <LeadStatusBadge status={lead.status} />
          </div>

          <div className="text-muted-foreground mb-3 flex items-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => onEmailClick(lead.email)}
              className="hover:text-primary flex items-center gap-1 transition-colors"
            >
              <Mail className="h-3 w-3" />
              {lead.email}
              <ExternalLink className="h-3 w-3" />
            </button>
            <span>•</span>
            <span>
              {formatDistanceToNow(new Date(lead.createdAt), {
                addSuffix: true,
              })}
            </span>
          </div>

          <LeadMessage
            message={lead.message}
            isExpanded={isExpanded}
            onToggleExpanded={() => onToggleExpanded(lead.id)}
          />
        </div>

        <LeadActionsMenu
          lead={lead}
          onEmailClick={onEmailClick}
          onStatusUpdate={onStatusUpdate}
          onDelete={onDelete}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

function EmptyState({
  onRefresh,
  isRefreshing,
}: {
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <div className="py-16 text-center">
      <MessageCircle className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
      <h3 className="mb-2 text-lg font-semibold">No leads yet</h3>
      <p className="text-muted-foreground mx-auto mb-6 max-w-md">
        When someone contacts you through your portfolio contact form, their
        messages will appear here.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onRefresh}
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

function LeadsHeader({
  leadsCount,
  onRefresh,
  isRefreshing,
}: {
  leadsCount: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-xl font-semibold">Leads ({leadsCount})</h2>
        <p className="text-muted-foreground text-sm">
          Manage messages from your portfolio contact form
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onRefresh}
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
  );
}

// Main component
export function LeadsList({ userId, leads: initialLeads }: LeadsListProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [expandedLead, setExpandedLead] = useState<string | null>(null);

  const {
    isUpdating,
    isDeleting,
    isRefreshing,
    refreshLeads,
    handleStatusUpdate,
    handleDelete,
  } = useLeadOperations(userId, leads, setLeads);

  const handleToggleExpanded = (leadId: string) => {
    setExpandedLead(expandedLead === leadId ? null : leadId);
  };

  if (leads.length === 0) {
    return <EmptyState onRefresh={refreshLeads} isRefreshing={isRefreshing} />;
  }

  const sortedLeads = sortLeads(leads);

  return (
    <div className="space-y-6">
      <LeadsHeader
        leadsCount={leads.length}
        onRefresh={refreshLeads}
        isRefreshing={isRefreshing}
      />

      <div className="space-y-3">
        {sortedLeads.map((lead) => (
          <LeadItem
            key={lead.id}
            lead={lead}
            isExpanded={expandedLead === lead.id}
            isLoading={isUpdating === lead.id || isDeleting === lead.id}
            onToggleExpanded={handleToggleExpanded}
            onEmailClick={openEmail}
            onStatusUpdate={handleStatusUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
