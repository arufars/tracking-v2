"use client";

import { useMemo, useState } from "react";

import {
  Activity,
  ArrowRight,
  ChevronRight,
  Clock,
  DollarSign,
  Edit3,
  Eye,
  Film,
  FolderKanban,
  ListTree,
  Plus,
  Shield,
  Trash2,
  User,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { type AuditFilters, AuditFiltersBar } from "./audit-filters";

// Types
interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  entity_name?: string;
  old_value: Record<string, any> | null;
  new_value: Record<string, any> | null;
  created_at: string;
  user_id: string;
  user_name: string;
  user_email: string;
  user_role: string;
  user_avatar?: string;
}

interface AuditLogsListProps {
  logs: AuditLog[];
  entityTypes: string[];
  users: Array<{ id: string; name: string }>;
}

const actionColors: Record<string, string> = {
  INSERT: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 ring-green-600/20",
  UPDATE: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 ring-blue-600/20",
  DELETE: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 ring-red-600/20",
};

const actionIcons: Record<string, typeof Plus> = {
  INSERT: Plus,
  UPDATE: Edit3,
  DELETE: Trash2,
};

const entityIcons: Record<string, typeof Activity> = {
  users: User,
  projects: FolderKanban,
  episodes: Film,
  payments: DollarSign,
  stage_tasks: Activity,
};

const roleColors: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  production: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  broadcaster: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  investor: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
};

// Helper functions
function getChangedFields(oldValue: Record<string, any> | null, newValue: Record<string, any> | null): string[] {
  if (!oldValue || !newValue) return [];
  const changes: string[] = [];
  const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);
  for (const key of allKeys) {
    if (JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key]) && key !== "id" && key !== "updated_at") {
      changes.push(key);
    }
  }
  return changes;
}

function formatFieldName(field: string): string {
  return field.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function formatValue(value: any): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  if (typeof value === "string" && value.length > 50) return value.substring(0, 50) + "...";
  return String(value);
}

function getEntityDisplayName(log: AuditLog): string {
  if (log.entity_name) return log.entity_name;

  // Try to extract name from new_value or old_value
  const data = log.new_value || log.old_value;
  if (data) {
    return data.title || data.name || data.full_name || data.episode_number || `#${log.entity_id.substring(0, 8)}`;
  }
  return `#${log.entity_id.substring(0, 8)}`;
}

function timeAgo(date: string): string {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);

  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

// Log Detail Dialog
function LogDetailDialog({ log }: { log: AuditLog }) {
  const changedFields = getChangedFields(log.old_value, log.new_value);
  const ActionIcon = actionIcons[log.action];
  const EntityIcon = entityIcons[log.entity_type] || Activity;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1">
          <Eye className="h-3 w-3" />
          Details
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="outline" className={`gap-1 ${actionColors[log.action]}`}>
              <ActionIcon className="h-3 w-3" />
              {log.action}
            </Badge>
            <span className="capitalize">{log.entity_type.replace("_", " ")}</span>
          </DialogTitle>
          <DialogDescription>
            {new Date(log.created_at).toLocaleString("id-ID", {
              dateStyle: "full",
              timeStyle: "medium",
            })}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-6">
            {/* User Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={log.user_avatar} />
                <AvatarFallback className="bg-primary/10">
                  {log.user_name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{log.user_name || "System"}</div>
                <div className="text-sm text-muted-foreground">{log.user_email}</div>
              </div>
              <Badge variant="outline" className={roleColors[log.user_role] || ""}>
                <Shield className="h-3 w-3 mr-1" />
                {log.user_role}
              </Badge>
            </div>

            {/* Entity Info */}
            <div className="p-3 border rounded-lg">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <EntityIcon className="h-4 w-4" />
                <span className="capitalize">{log.entity_type.replace("_", " ")}</span>
              </div>
              <div className="font-medium">{getEntityDisplayName(log)}</div>
              <div className="text-xs text-muted-foreground font-mono mt-1">{log.entity_id}</div>
            </div>

            {/* Changes */}
            {log.action === "UPDATE" && changedFields.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <ListTree className="h-4 w-4" />
                  Changed Fields ({changedFields.length})
                </h4>
                <div className="space-y-2">
                  {changedFields.map((field) => (
                    <div key={field} className="p-3 border rounded-lg">
                      <div className="text-sm font-medium text-muted-foreground mb-2">{formatFieldName(field)}</div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 p-2 bg-red-50 dark:bg-red-900/10 rounded text-sm line-through text-red-600 dark:text-red-400">
                          {formatValue(log.old_value?.[field])}
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 p-2 bg-green-50 dark:bg-green-900/10 rounded text-sm text-green-600 dark:text-green-400">
                          {formatValue(log.new_value?.[field])}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Record */}
            {log.action === "INSERT" && log.new_value && (
              <div>
                <h4 className="font-medium mb-3">New Record Data</h4>
                <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg">
                  <div className="grid gap-2 text-sm">
                    {Object.entries(log.new_value)
                      .filter(([key]) => !["id", "created_at", "updated_at"].includes(key))
                      .slice(0, 10)
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{formatFieldName(key)}:</span>
                          <span className="font-medium">{formatValue(value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {/* Deleted Record */}
            {log.action === "DELETE" && log.old_value && (
              <div>
                <h4 className="font-medium mb-3 text-red-600">Deleted Record Data</h4>
                <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg">
                  <div className="grid gap-2 text-sm">
                    {Object.entries(log.old_value)
                      .filter(([key]) => !["id", "created_at", "updated_at"].includes(key))
                      .slice(0, 10)
                      .map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{formatFieldName(key)}:</span>
                          <span className="font-medium line-through">{formatValue(value)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Timeline View Component
function TimelineView({ logs }: { logs: AuditLog[] }) {
  // Group logs by date
  const groupedLogs = useMemo(() => {
    const groups: Record<string, AuditLog[]> = {};
    for (const log of logs) {
      const date = new Date(log.created_at).toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(log);
    }
    return groups;
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No matching logs found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(groupedLogs).map(([date, dateLogs]) => (
        <div key={date}>
          <div className="sticky top-0 bg-background/95 backdrop-blur py-2 mb-3 z-10">
            <h3 className="text-sm font-medium text-muted-foreground">{date}</h3>
          </div>
          <div className="relative pl-6 border-l-2 border-muted space-y-4">
            {dateLogs.map((log) => {
              const ActionIcon = actionIcons[log.action];
              const EntityIcon = entityIcons[log.entity_type] || Activity;
              const changedFields = getChangedFields(log.old_value, log.new_value);

              return (
                <div key={log.id} className="relative">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-[25px] w-4 h-4 rounded-full border-2 border-background ${
                      log.action === "INSERT" ? "bg-green-500" : log.action === "DELETE" ? "bg-red-500" : "bg-blue-500"
                    }`}
                  />

                  <div className="p-4 bg-card border rounded-lg hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge variant="outline" className={`gap-1 ${actionColors[log.action]}`}>
                            <ActionIcon className="h-3 w-3" />
                            {log.action}
                          </Badge>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <EntityIcon className="h-3 w-3" />
                            <span className="text-sm capitalize">{log.entity_type.replace("_", " ")}</span>
                          </div>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {timeAgo(log.created_at)}
                          </span>
                        </div>

                        {/* Entity name */}
                        <div className="font-medium mb-2">{getEntityDisplayName(log)}</div>

                        {/* User info */}
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={log.user_avatar} />
                            <AvatarFallback className="text-xs bg-primary/10">
                              {log.user_name?.charAt(0).toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm">
                            <span className="font-medium">{log.user_name || "System"}</span>
                            {log.user_role && (
                              <Badge variant="outline" className={`ml-2 text-xs ${roleColors[log.user_role] || ""}`}>
                                {log.user_role}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Changed fields preview */}
                        {log.action === "UPDATE" && changedFields.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {changedFields.slice(0, 4).map((field) => (
                              <Badge key={field} variant="outline" className="text-xs">
                                {formatFieldName(field)}
                              </Badge>
                            ))}
                            {changedFields.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{changedFields.length - 4} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>

                      <LogDetailDialog log={log} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// Table View Component
function TableView({ logs }: { logs: AuditLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No matching logs found</p>
        <p className="text-sm mt-1">Try adjusting your filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {logs.map((log) => {
        const ActionIcon = actionIcons[log.action];
        const EntityIcon = entityIcons[log.entity_type] || Activity;
        const changedFields = getChangedFields(log.old_value, log.new_value);

        return (
          <div
            key={log.id}
            className="flex items-center gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            {/* Timestamp */}
            <div className="text-sm text-muted-foreground w-20 shrink-0">
              <div>{new Date(log.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short" })}</div>
              <div className="text-xs">
                {new Date(log.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>

            {/* User */}
            <div className="flex items-center gap-2 w-48 shrink-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={log.user_avatar} />
                <AvatarFallback className="text-xs bg-primary/10">
                  {log.user_name?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{log.user_name || "System"}</div>
                <Badge variant="outline" className={`text-xs ${roleColors[log.user_role] || ""}`}>
                  {log.user_role || "system"}
                </Badge>
              </div>
            </div>

            {/* Action */}
            <Badge variant="outline" className={`gap-1 shrink-0 ${actionColors[log.action]}`}>
              <ActionIcon className="h-3 w-3" />
              {log.action}
            </Badge>

            {/* Entity */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <EntityIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{getEntityDisplayName(log)}</div>
                <div className="text-xs text-muted-foreground capitalize">{log.entity_type.replace("_", " ")}</div>
              </div>
            </div>

            {/* Changes */}
            <div className="hidden lg:flex flex-wrap gap-1 w-48 shrink-0">
              {log.action === "INSERT" && (
                <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-xs">
                  New record
                </Badge>
              )}
              {log.action === "DELETE" && (
                <Badge variant="outline" className="bg-red-50 dark:bg-red-900/20 text-xs">
                  Deleted
                </Badge>
              )}
              {log.action === "UPDATE" &&
                changedFields.slice(0, 2).map((field) => (
                  <Badge key={field} variant="outline" className="text-xs">
                    {formatFieldName(field)}
                  </Badge>
                ))}
              {log.action === "UPDATE" && changedFields.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{changedFields.length - 2}
                </Badge>
              )}
            </div>

            {/* View Details */}
            <LogDetailDialog log={log} />
          </div>
        );
      })}
    </div>
  );
}

// Main Component
export function AuditLogsTable({ logs, entityTypes, users }: AuditLogsListProps) {
  const [filters, setFilters] = useState<AuditFilters>({
    search: "",
    action: "all",
    entityType: "all",
    userId: "all",
    dateFrom: undefined,
    dateTo: undefined,
  });

  // Filter logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          log.user_name?.toLowerCase().includes(searchLower) ||
          log.user_email?.toLowerCase().includes(searchLower) ||
          log.entity_type.toLowerCase().includes(searchLower) ||
          getEntityDisplayName(log).toLowerCase().includes(searchLower) ||
          JSON.stringify(log.old_value).toLowerCase().includes(searchLower) ||
          JSON.stringify(log.new_value).toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Action filter
      if (filters.action !== "all" && log.action !== filters.action) return false;

      // Entity type filter
      if (filters.entityType !== "all" && log.entity_type !== filters.entityType) return false;

      // User filter
      if (filters.userId !== "all" && log.user_id !== filters.userId) return false;

      // Date range filter
      const logDate = new Date(log.created_at);
      if (filters.dateFrom && logDate < filters.dateFrom) return false;
      if (filters.dateTo) {
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (logDate > endOfDay) return false;
      }

      return true;
    });
  }, [logs, filters]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          <div>
            <CardTitle>System Activity Logs</CardTitle>
            <CardDescription>
              Track all changes and actions in the system • {filteredLogs.length} of {logs.length} records
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <AuditFiltersBar filters={filters} onFiltersChange={setFilters} entityTypes={entityTypes} users={users} />

        {/* View Tabs */}
        <Tabs defaultValue="table" className="w-full">
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="timeline">Timeline View</TabsTrigger>
          </TabsList>
          <TabsContent value="table" className="mt-4">
            <ScrollArea className="h-[500px]">
              <TableView logs={filteredLogs} />
            </ScrollArea>
          </TabsContent>
          <TabsContent value="timeline" className="mt-4">
            <ScrollArea className="h-[500px]">
              <TimelineView logs={filteredLogs} />
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
