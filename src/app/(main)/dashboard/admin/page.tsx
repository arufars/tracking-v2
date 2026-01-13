import { Suspense } from "react";

import { redirect } from "next/navigation";

import { Activity, DollarSign, Film, FolderKanban, Users } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Stats Overview Component
async function StatsOverview() {
  const supabase = await createSupabaseServerClient();

  // Fetch statistics
  const [{ count: usersCount }, { count: projectsCount }, { count: episodesCount }, { data: paymentsData }] =
    await Promise.all([
      supabase.from("users").select("*", { count: "exact", head: true }),
      supabase.from("projects").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("episodes").select("*", { count: "exact", head: true }),
      supabase.from("payments").select("amount, status"),
    ]);

  const totalPayments = paymentsData?.reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;
  const paidAmount =
    paymentsData?.filter((p) => p.status === "paid").reduce((sum, p) => sum + (Number(p.amount) || 0), 0) || 0;

  const stats = [
    {
      title: "Total Users",
      value: usersCount || 0,
      description: "Registered users in system",
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Active Projects",
      value: projectsCount || 0,
      description: "Currently in progress",
      icon: FolderKanban,
      color: "text-green-600",
    },
    {
      title: "Total Episodes",
      value: episodesCount || 0,
      description: "Across all projects",
      icon: Film,
      color: "text-purple-600",
    },
    {
      title: "Payments",
      value: `${((paidAmount / totalPayments) * 100 || 0).toFixed(0)}%`,
      description: `Rp ${(paidAmount / 1000000).toFixed(1)}M / ${(totalPayments / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Recent Users Component
async function RecentUsers() {
  const supabase = await createSupabaseServerClient();

  const { data: users } = await supabase
    .from("users")
    .select("id, full_name, email, role, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Users</CardTitle>
        <CardDescription>Latest registered users</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {users?.map((user) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">{user.full_name?.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="text-sm font-medium">{user.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize">
                  {user.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Recent Projects Component
async function RecentProjects() {
  const supabase = await createSupabaseServerClient();

  const { data: projects } = await supabase
    .from("projects")
    .select("id, title, type, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  const statusColors: Record<string, string> = {
    active: "bg-green-100 text-green-800 ring-green-600/20",
    completed: "bg-blue-100 text-blue-800 ring-blue-600/20",
    archived: "bg-gray-100 text-gray-800 ring-gray-600/20",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Projects</CardTitle>
        <CardDescription>Latest created projects</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {projects?.map((project) => (
            <div key={project.id} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{project.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{project.type}</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset capitalize ${statusColors[project.status]}`}
              >
                {project.status}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Recent Activity (Audit Logs)
async function RecentActivity() {
  const supabase = await createSupabaseServerClient();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, action, entity_type, created_at, users(full_name)")
    .order("created_at", { ascending: false })
    .limit(8);

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Latest system changes and updates</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs?.map((log) => (
            <div key={log.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
              <div className="flex items-center gap-2">
                <span className="font-medium">{(log.users as any)?.full_name || "System"}</span>
                <span className="text-muted-foreground">
                  {log.action === "INSERT" ? "created" : log.action === "UPDATE" ? "updated" : "deleted"}
                </span>
                <span className="font-medium capitalize">{log.entity_type}</span>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function StatsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Main Page Component
export default async function AdminDashboardPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user is admin
  const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (userProfile?.role !== "admin") {
    redirect("/unauthorized");
  }

  return (
    <div className="@container/main flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">System overview and management console</p>
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsOverview />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2">
        <Suspense fallback={<Skeleton className="h-[300px]" />}>
          <RecentUsers />
        </Suspense>

        <Suspense fallback={<Skeleton className="h-[300px]" />}>
          <RecentProjects />
        </Suspense>
      </div>

      <Suspense fallback={<Skeleton className="h-[400px]" />}>
        <RecentActivity />
      </Suspense>
    </div>
  );
}
