import { Suspense } from "react";

import { redirect } from "next/navigation";

import { Activity, Clock, Edit3, Plus, Trash2, TrendingUp, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import {
  ActionDistribution,
  ActivityTimeline,
  EntityActivityChart,
  HourlyActivityChart,
} from "./_components/audit-charts";
import { AuditLogsTable } from "./_components/audit-logs-table";

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

// Fetch all audit data
async function getAuditData() {
  const supabase = await createSupabaseServerClient();

  // Fetch logs with user data
  const { data: logs } = await supabase
    .from("audit_logs")
    .select(
      `
      id,
      action,
      entity_type,
      entity_id,
      old_value,
      new_value,
      created_at,
      user_id,
      users(full_name, email, role, avatar_url)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(500);

  // Transform logs to include flattened user data
  const transformedLogs: AuditLog[] =
    logs?.map((log) => {
      const userData = log.users as any;
      const entityData = log.new_value || log.old_value;

      return {
        id: log.id,
        action: log.action,
        entity_type: log.entity_type,
        entity_id: log.entity_id,
        entity_name: entityData?.title || entityData?.name || entityData?.full_name || entityData?.episode_number,
        old_value: log.old_value,
        new_value: log.new_value,
        created_at: log.created_at,
        user_id: log.user_id || "",
        user_name: userData?.full_name || "System",
        user_email: userData?.email || "-",
        user_role: userData?.role || "system",
        user_avatar: userData?.avatar_url,
      };
    }) || [];

  // Get unique entity types
  const entityTypes = [...new Set(transformedLogs.map((log) => log.entity_type))];

  // Get unique users for filter
  const usersMap = new Map<string, { id: string; name: string }>();
  for (const log of transformedLogs) {
    if (log.user_id && !usersMap.has(log.user_id)) {
      usersMap.set(log.user_id, { id: log.user_id, name: log.user_name });
    }
  }
  const users = Array.from(usersMap.values());

  return { logs: transformedLogs, entityTypes, users };
}

// Calculate statistics
function calculateStats(logs: AuditLog[]) {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const recentLogs = logs.filter((log) => new Date(log.created_at) >= yesterday);
  const lastWeekLogs = logs.filter((log) => new Date(log.created_at) >= lastWeek);

  const insertions = logs.filter((l) => l.action === "INSERT").length;
  const updates = logs.filter((l) => l.action === "UPDATE").length;
  const deletions = logs.filter((l) => l.action === "DELETE").length;

  // Unique active users today
  const activeUsersToday = new Set(recentLogs.map((log) => log.user_id).filter(Boolean)).size;

  // Most active entity
  const entityCounts = logs.reduce(
    (acc, log) => {
      acc[log.entity_type] = (acc[log.entity_type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const mostActiveEntity = Object.entries(entityCounts).sort((a, b) => b[1] - a[1])[0];

  return {
    total: logs.length,
    recentActivity: recentLogs.length,
    insertions,
    updates,
    deletions,
    activeUsersToday,
    mostActiveEntity: mostActiveEntity ? { name: mostActiveEntity[0], count: mostActiveEntity[1] } : null,
    weeklyLogs: lastWeekLogs.length,
  };
}

// Calculate timeline data (last 7 days)
function calculateTimelineData(logs: AuditLog[]) {
  const days: Record<string, { date: string; insert: number; update: number; delete: number }> = {};

  // Initialize last 7 days
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    days[dateStr] = { date: dateStr, insert: 0, update: 0, delete: 0 };
  }

  // Count logs per day
  for (const log of logs) {
    const dateStr = new Date(log.created_at).toISOString().split("T")[0];
    if (days[dateStr]) {
      if (log.action === "INSERT") days[dateStr].insert++;
      else if (log.action === "UPDATE") days[dateStr].update++;
      else if (log.action === "DELETE") days[dateStr].delete++;
    }
  }

  return Object.values(days);
}

// Calculate hourly activity (last 24h)
function calculateHourlyData(logs: AuditLog[]) {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentLogs = logs.filter((log) => new Date(log.created_at) >= yesterday);

  const hours: Record<number, number> = {};
  for (let i = 0; i < 24; i++) {
    hours[i] = 0;
  }

  for (const log of recentLogs) {
    const hour = new Date(log.created_at).getHours();
    hours[hour]++;
  }

  return Object.entries(hours).map(([hour, count]) => ({
    hour: `${hour.padStart(2, "0")}:00`,
    count,
  }));
}

// Calculate entity activity
function calculateEntityData(logs: AuditLog[]) {
  const entities: Record<string, { entity: string; insert: number; update: number; delete: number; total: number }> =
    {};

  for (const log of logs) {
    if (!entities[log.entity_type]) {
      entities[log.entity_type] = { entity: log.entity_type, insert: 0, update: 0, delete: 0, total: 0 };
    }
    entities[log.entity_type].total++;
    if (log.action === "INSERT") entities[log.entity_type].insert++;
    else if (log.action === "UPDATE") entities[log.entity_type].update++;
    else if (log.action === "DELETE") entities[log.entity_type].delete++;
  }

  return Object.values(entities).sort((a, b) => b.total - a.total);
}

// Stats Card Component
function StatsCards({ stats }: { stats: ReturnType<typeof calculateStats> }) {
  const cards = [
    {
      label: "Total Logs",
      value: stats.total,
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
      description: "All time records",
    },
    {
      label: "Last 24 Hours",
      value: stats.recentActivity,
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
      description: "Recent activity",
    },
    {
      label: "Active Users Today",
      value: stats.activeUsersToday,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
      description: "Unique users",
    },
    {
      label: "Weekly Activity",
      value: stats.weeklyLogs,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
      description: "Last 7 days",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((stat) => (
        <Card key={stat.label}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Action Summary Cards
function ActionSummary({ stats }: { stats: ReturnType<typeof calculateStats> }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <Plus className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{stats.insertions}</div>
              <div className="text-sm text-muted-foreground">Created</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Edit3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{stats.updates}</div>
              <div className="text-sm text-muted-foreground">Updated</div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <Trash2 className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">{stats.deletions}</div>
              <div className="text-sm text-muted-foreground">Deleted</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Loading Skeletons
function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-20 mt-2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ChartsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Main Content Component (Server Component)
async function AuditLogsContent() {
  const { logs, entityTypes, users } = await getAuditData();
  const stats = calculateStats(logs);
  const timelineData = calculateTimelineData(logs);
  const hourlyData = calculateHourlyData(logs);
  const entityData = calculateEntityData(logs);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <StatsCards stats={stats} />

      {/* Action Summary */}
      <ActionSummary stats={stats} />

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <ActivityTimeline data={timelineData} />
        <ActionDistribution data={{ insert: stats.insertions, update: stats.updates, delete: stats.deletions }} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <EntityActivityChart data={entityData} />
        <HourlyActivityChart data={hourlyData} />
      </div>

      {/* Logs Table */}
      <AuditLogsTable logs={logs} entityTypes={entityTypes} users={users} />
    </div>
  );
}

// Main Page Component
export default async function AuditLogsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is admin or production
  const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (!userProfile || !["admin", "production"].includes(userProfile.role)) {
    redirect("/unauthorized");
  }

  return (
    <div className="@container/main flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground">Monitor all system activities and track changes across the platform</p>
        </div>
        <Badge variant="outline" className="gap-1 w-fit">
          <Activity className="h-3 w-3" />
          Real-time tracking
        </Badge>
      </div>

      {/* Content */}
      <Suspense
        fallback={
          <div className="space-y-6">
            <StatsSkeleton />
            <ChartsSkeleton />
            <TableSkeleton />
          </div>
        }
      >
        <AuditLogsContent />
      </Suspense>
    </div>
  );
}
