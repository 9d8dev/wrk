"use client";

import { useState, useEffect, useCallback } from "react";
import { Lead, leadStatuses } from "@/db/schema";
import {
  updateLeadStatus,
  deleteLead,
  getLeadsByUserId,
} from "@/lib/actions/leads";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Trash2,
  Mail,
  Check,
  Clock,
  Archive,
  RefreshCw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";

type LeadsListProps = {
  userId: string;
  leads: Lead[];
};

export function LeadsList({ userId, leads: initialLeads }: LeadsListProps) {
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
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
  }, [userId]);

  const handleStatusUpdate = async (
    leadId: string,
    status: (typeof leadStatuses)[number]
  ) => {
    try {
      setIsUpdating(leadId);
      await updateLeadStatus(leadId, status);

      // Update the lead in the local state
      setLeads(
        leads.map((lead) =>
          lead.id === leadId ? { ...lead, status, updatedAt: new Date() } : lead
        )
      );

      toast.success(`Lead status updated to ${status}`);
    } catch (error) {
      console.error("Error updating lead status:", error);
      toast.error("Failed to update lead status");
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDelete = async (leadId: string) => {
    try {
      setIsDeleting(leadId);
      await deleteLead(leadId);

      // Remove the lead from the local state
      setLeads(leads.filter((lead) => lead.id !== leadId));

      toast.success("Lead deleted successfully");
    } catch (error) {
      console.error("Error deleting lead:", error);
      toast.error("Failed to delete lead");
    } finally {
      setIsDeleting(null);
    }
  };

  const getStatusIcon = (status: (typeof leadStatuses)[number]) => {
    switch (status) {
      case "new":
        return <Clock className="h-4 w-4" />;
      case "contacted":
        return <Mail className="h-4 w-4" />;
      case "resolved":
        return <Check className="h-4 w-4" />;
      case "archived":
        return <Archive className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: (typeof leadStatuses)[number]) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "contacted":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "resolved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
      default:
        return "";
    }
  };

  useEffect(() => {
    refreshLeads();
  }, [refreshLeads]);

  if (leads.length === 0) {
    return (
      <div className="py-12">
        <h3 className="text-lg font-medium">No leads yet</h3>
        <p className="text-sm text-muted-foreground mt-1">
          When someone contacts you through your portfolio, their messages will
          appear here.
        </p>
        <Button
          variant="outline"
          className="mt-4"
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
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell>
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {lead.email}
                  </a>
                </TableCell>
                <TableCell className="max-w-xs truncate" title={lead.message}>
                  {lead.message.length > 50
                    ? `${lead.message.substring(0, 50)}...`
                    : lead.message}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`flex items-center gap-1 ${getStatusColor(
                      lead.status as (typeof leadStatuses)[number]
                    )}`}
                  >
                    {getStatusIcon(
                      lead.status as (typeof leadStatuses)[number]
                    )}
                    <span className="capitalize">{lead.status}</span>
                  </Badge>
                </TableCell>
                <TableCell>
                  {formatDistanceToNow(new Date(lead.createdAt), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={
                          isUpdating === lead.id || isDeleting === lead.id
                        }
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        className="text-blue-600 dark:text-blue-400"
                        onClick={() =>
                          window.open(`mailto:${lead.email}`, "_blank")
                        }
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        <span>Email</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(lead.id, "new")}
                        disabled={lead.status === "new"}
                      >
                        <Clock className="mr-2 h-4 w-4" />
                        <span>Mark as New</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(lead.id, "contacted")}
                        disabled={lead.status === "contacted"}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        <span>Mark as Contacted</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(lead.id, "resolved")}
                        disabled={lead.status === "resolved"}
                      >
                        <Check className="mr-2 h-4 w-4" />
                        <span>Mark as Resolved</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusUpdate(lead.id, "archived")}
                        disabled={lead.status === "archived"}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        <span>Archive</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 dark:text-red-400"
                        onClick={() => handleDelete(lead.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
