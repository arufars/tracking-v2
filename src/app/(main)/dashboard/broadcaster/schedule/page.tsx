import { redirect } from "next/navigation";

import { AlertCircle, Calendar as CalendarIcon, Clock, Package, Tv, Video } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Delivery Schedule",
  description: "View delivery schedule and air dates",
};

interface ScheduleEvent {
  id: string;
  project_name: string;
  episode_number: number;
  episode_title: string;
  event_type: "delivery" | "air_date";
  event_date: string;
  channel_tv: string | null;
  current_stage: string;
  progress_percentage: number;
  days_until: number;
}

async function getBroadcasterSchedule(userId: string) {
  const supabase = await createSupabaseServerClient();

  // Get projects where user is a broadcaster
  const { data: userProjects } = await supabase.from("user_projects").select("project_id").eq("user_id", userId);

  const projectIds = userProjects?.map((up) => up.project_id) || [];

  if (projectIds.length === 0) {
    return [];
  }

  // Get episodes with dates
  const { data: episodes, error } = await supabase
    .from("episodes")
    .select(
      `
      id,
      episode_number,
      episode_title,
      deadline,
      air_time,
      channel_tv,
      progress_percentage,
      projects!inner (
        project_name
      ),
      episode_stages (
        current_stage
      )
    `,
    )
    .in("project_id", projectIds)
    .order("deadline", { ascending: true });

  if (error) {
    console.error("Error fetching schedule:", error);
    return [];
  }

  // Transform to schedule events
  const events: ScheduleEvent[] = [];
  const today = new Date();

  episodes?.forEach((episode: any) => {
    const currentStage = episode.episode_stages?.[0]?.current_stage || "shooting";

    // Add delivery event (deadline)
    if (episode.deadline) {
      const eventDate = new Date(episode.deadline);
      const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      events.push({
        id: `${episode.id}-delivery`,
        project_name: episode.projects.project_name,
        episode_number: episode.episode_number,
        episode_title: episode.episode_title,
        event_type: "delivery",
        event_date: episode.deadline,
        channel_tv: episode.channel_tv,
        current_stage: currentStage,
        progress_percentage: episode.progress_percentage || 0,
        days_until: daysUntil,
      });
    }

    // Add air date event
    if (episode.air_time) {
      const eventDate = new Date(episode.air_time);
      const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      events.push({
        id: `${episode.id}-air`,
        project_name: episode.projects.project_name,
        episode_number: episode.episode_number,
        episode_title: episode.episode_title,
        event_type: "air_date",
        event_date: episode.air_time,
        channel_tv: episode.channel_tv,
        current_stage: currentStage,
        progress_percentage: episode.progress_percentage || 0,
        days_until: daysUntil,
      });
    }
  });

  // Sort by date
  events.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  return events;
}

function groupEventsByMonth(events: ScheduleEvent[]) {
  const grouped: Record<string, ScheduleEvent[]> = {};

  events.forEach((event) => {
    const date = new Date(event.event_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const monthLabel = date.toLocaleDateString("id-ID", {
      month: "long",
      year: "numeric",
    });

    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(event);
  });

  return grouped;
}

function ScheduleEventCard({ event }: { event: ScheduleEvent }) {
  const isDelivery = event.event_type === "delivery";
  const isOverdue = event.days_until < 0;
  const isUrgent = event.days_until <= 7 && event.days_until >= 0;
  const isToday = event.days_until === 0;

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        isOverdue && isDelivery && "border-red-500 border-2",
        isUrgent && "border-orange-500",
        isToday && "border-blue-500 border-2",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {isDelivery ? (
                <Badge className="bg-purple-100 text-purple-700">
                  <Package className="h-3 w-3 mr-1" />
                  Delivery
                </Badge>
              ) : (
                <Badge className="bg-green-100 text-green-700">
                  <Video className="h-3 w-3 mr-1" />
                  Air Date
                </Badge>
              )}
              {isToday && <Badge variant="default">Hari Ini</Badge>}
              {isOverdue && isDelivery && <Badge variant="destructive">Terlambat</Badge>}
              {isUrgent && !isToday && !isOverdue && (
                <Badge variant="outline" className="text-orange-600">
                  {event.days_until} hari lagi
                </Badge>
              )}
            </div>
            <CardTitle className="text-sm line-clamp-1">
              {event.project_name} - Episode {event.episode_number}
            </CardTitle>
            <CardDescription className="text-xs line-clamp-1">{event.episode_title}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Date */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarIcon className="h-3 w-3" />
            <span>{isDelivery ? "Jadwal Penyerahan" : "Jadwal Tayang"}</span>
          </div>
          <div className={cn("text-sm font-medium", isOverdue && isDelivery && "text-red-600")}>
            {new Date(event.event_date).toLocaleDateString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
        </div>

        {/* Channel (for air date) */}
        {event.channel_tv && event.event_type === "air_date" && (
          <div className="flex items-center gap-2 text-sm">
            <Tv className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Channel:</span>
            <span className="font-medium">{event.channel_tv}</span>
          </div>
        )}

        {/* Progress (for delivery) */}
        {event.event_type === "delivery" && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Progress:</span>
            <span className="font-medium">{event.progress_percentage}%</span>
            <Badge variant="outline" className="text-xs ml-auto">
              {event.current_stage}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function MonthSection({ monthKey, events }: { monthKey: string; events: ScheduleEvent[] }) {
  const [year, month] = monthKey.split("-");
  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  const deliveryCount = events.filter((e) => e.event_type === "delivery").length;
  const airDateCount = events.filter((e) => e.event_type === "air_date").length;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <h2 className="text-xl font-semibold">{monthName}</h2>
        <Badge variant="secondary">{events.length} events</Badge>
        <Badge className="bg-purple-100 text-purple-700">{deliveryCount} deliveries</Badge>
        <Badge className="bg-green-100 text-green-700">{airDateCount} air dates</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <ScheduleEventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

function ScheduleStats({ events }: { events: ScheduleEvent[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayEvents = events.filter((e) => {
    const eventDate = new Date(e.event_date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate.getTime() === today.getTime();
  }).length;

  const upcomingDeliveries = events.filter((e) => {
    if (e.event_type !== "delivery") return false;
    return e.days_until <= 7 && e.days_until >= 0;
  }).length;

  const overdueDeliveries = events.filter((e) => {
    if (e.event_type !== "delivery") return false;
    return e.days_until < 0;
  }).length;

  const upcomingAirDates = events.filter((e) => {
    if (e.event_type !== "air_date") return false;
    return e.days_until <= 30 && e.days_until >= 0;
  }).length;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today</CardTitle>
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todayEvents}</div>
          <p className="text-xs text-muted-foreground">Events scheduled</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Deliveries</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingDeliveries}</div>
          <p className="text-xs text-muted-foreground">Next 7 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{overdueDeliveries}</div>
          <p className="text-xs text-muted-foreground">Need attention</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Upcoming Airs</CardTitle>
          <Video className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingAirDates}</div>
          <p className="text-xs text-muted-foreground">Next 30 days</p>
        </CardContent>
      </Card>
    </div>
  );
}

export default async function BroadcasterSchedulePage() {
  const supabase = await createSupabaseServerClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check role
  const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();

  if (!userData || (userData.role !== "broadcaster" && userData.role !== "admin")) {
    redirect("/unauthorized");
  }

  const events = await getBroadcasterSchedule(user.id);
  const groupedEvents = groupEventsByMonth(events);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Jadwal Penyerahan (Delivery Schedule)</h1>
        <p className="text-muted-foreground">View all delivery schedules and air dates</p>
      </div>

      {/* Stats */}
      <ScheduleStats events={events} />

      {/* Schedule Calendar */}
      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Schedule Found</h3>
            <p className="text-sm text-muted-foreground text-center">
              No delivery schedules or air dates found in your projects.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedEvents).map(([monthKey, monthEvents]) => (
            <MonthSection key={monthKey} monthKey={monthKey} events={monthEvents} />
          ))}
        </div>
      )}
    </div>
  );
}
