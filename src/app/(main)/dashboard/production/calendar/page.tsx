import { redirect } from "next/navigation";

import { AlertCircle, Calendar as CalendarIcon, CheckCircle2, Clock, Film, MapPin, Video } from "lucide-react";
import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Production Calendar",
  description: "View production schedule and deadlines",
};

interface CalendarEvent {
  id: string;
  episode_id: string;
  project_name: string;
  episode_number: number;
  episode_title: string;
  event_type: "deadline" | "air_time" | "shooting" | "editing";
  event_date: string;
  current_stage: string;
  status: string;
  channel_tv: string | null;
}

async function getProductionCalendar(userId: string) {
  const supabase = await createSupabaseServerClient();

  // Get projects where user is a team member
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
      status,
      deadline,
      air_time,
      channel_tv,
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
    console.error("Error fetching calendar:", error);
    return [];
  }

  // Transform to calendar events
  const events: CalendarEvent[] = [];

  episodes?.forEach((episode: any) => {
    const currentStage = episode.episode_stages?.[0]?.current_stage || "shooting";

    // Add deadline event
    if (episode.deadline) {
      events.push({
        id: `${episode.id}-deadline`,
        episode_id: episode.id,
        project_name: episode.projects.project_name,
        episode_number: episode.episode_number,
        episode_title: episode.episode_title,
        event_type: "deadline",
        event_date: episode.deadline,
        current_stage: currentStage,
        status: episode.status,
        channel_tv: episode.channel_tv,
      });
    }

    // Add air time event
    if (episode.air_time) {
      events.push({
        id: `${episode.id}-air`,
        episode_id: episode.id,
        project_name: episode.projects.project_name,
        episode_number: episode.episode_number,
        episode_title: episode.episode_title,
        event_type: "air_time",
        event_date: episode.air_time,
        current_stage: currentStage,
        status: episode.status,
        channel_tv: episode.channel_tv,
      });
    }
  });

  // Sort by date
  events.sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

  return events;
}

const EVENT_TYPE_CONFIG: Record<string, { label: string; icon: any; color: string; bgColor: string }> = {
  deadline: {
    label: "Deadline",
    icon: Clock,
    color: "text-red-700",
    bgColor: "bg-red-100",
  },
  air_time: {
    label: "Air Time",
    icon: Video,
    color: "text-green-700",
    bgColor: "bg-green-100",
  },
  shooting: {
    label: "Shooting",
    icon: Film,
    color: "text-blue-700",
    bgColor: "bg-blue-100",
  },
  editing: {
    label: "Editing",
    icon: Film,
    color: "text-purple-700",
    bgColor: "bg-purple-100",
  },
};

function groupEventsByMonth(events: CalendarEvent[]) {
  const grouped: Record<string, CalendarEvent[]> = {};

  events.forEach((event) => {
    const date = new Date(event.event_date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!grouped[monthKey]) {
      grouped[monthKey] = [];
    }
    grouped[monthKey].push(event);
  });

  return grouped;
}

function CalendarEventCard({ event }: { event: CalendarEvent }) {
  const eventConfig = EVENT_TYPE_CONFIG[event.event_type] || EVENT_TYPE_CONFIG.deadline;
  const Icon = eventConfig.icon;

  const eventDate = new Date(event.event_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isPast = eventDate < today;
  const isToday = eventDate.toDateString() === today.toDateString();
  const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const isUpcoming = daysUntil <= 7 && daysUntil > 0;

  return (
    <Card
      className={cn(
        "transition-all hover:shadow-md",
        isPast && event.event_type === "deadline" && event.status !== "completed" && "border-red-500 border-2",
        isToday && "border-blue-500 border-2",
        isUpcoming && "border-orange-500",
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={cn(eventConfig.bgColor, eventConfig.color)}>
                <Icon className="h-3 w-3 mr-1" />
                {eventConfig.label}
              </Badge>
              {isToday && <Badge variant="default">Today</Badge>}
              {isPast && event.event_type === "deadline" && event.status !== "completed" && (
                <Badge variant="destructive">Overdue</Badge>
              )}
              {isUpcoming && (
                <Badge variant="outline" className="text-orange-600">
                  {daysUntil} days
                </Badge>
              )}
            </div>
            <CardTitle className="text-sm line-clamp-1">
              {event.project_name} - E{event.episode_number}
            </CardTitle>
            <CardDescription className="text-xs line-clamp-1">{event.episode_title}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Date */}
        <div className="flex items-center gap-2 text-sm">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <span
            className={cn(
              isPast && event.event_type === "deadline" && event.status !== "completed" && "text-red-600 font-medium",
            )}
          >
            {eventDate.toLocaleDateString("id-ID", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </span>
        </div>

        {/* Channel (for air time) */}
        {event.channel_tv && event.event_type === "air_time" && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{event.channel_tv}</span>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between pt-2">
          <Badge variant={event.status === "completed" ? "outline" : "secondary"}>{event.status}</Badge>
          <Badge variant="outline" className="text-xs">
            {event.current_stage}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function MonthSection({ monthKey, events }: { monthKey: string; events: CalendarEvent[] }) {
  const [year, month] = monthKey.split("-");
  const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold">{monthName}</h2>
        <Badge variant="secondary">{events.length} events</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <CalendarEventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}

function CalendarStats({ events }: { events: CalendarEvent[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingDeadlines = events.filter((e) => {
    if (e.event_type !== "deadline") return false;
    const eventDate = new Date(e.event_date);
    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 7 && daysUntil >= 0;
  }).length;

  const overdueDeadlines = events.filter((e) => {
    if (e.event_type !== "deadline" || e.status === "completed") return false;
    const eventDate = new Date(e.event_date);
    return eventDate < today;
  }).length;

  const upcomingAirDates = events.filter((e) => {
    if (e.event_type !== "air_time") return false;
    const eventDate = new Date(e.event_date);
    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil <= 30 && daysUntil >= 0;
  }).length;

  const todayEvents = events.filter((e) => {
    const eventDate = new Date(e.event_date);
    return eventDate.toDateString() === today.toDateString();
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
          <CardTitle className="text-sm font-medium">This Week</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{upcomingDeadlines}</div>
          <p className="text-xs text-muted-foreground">Deadlines coming up</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{overdueDeadlines}</div>
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

export default async function ProductionCalendarPage() {
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

  if (!userData || (userData.role !== "production" && userData.role !== "admin")) {
    redirect("/unauthorized");
  }

  const events = await getProductionCalendar(user.id);
  const groupedEvents = groupEventsByMonth(events);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Calendar</h1>
          <p className="text-muted-foreground">View all production deadlines and air dates</p>
        </div>
        <Button>
          <CalendarIcon className="mr-2 h-4 w-4" />
          Add Event
        </Button>
      </div>

      {/* Stats */}
      <CalendarStats events={events} />

      {/* Calendar Events */}
      {events.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CalendarIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Events Scheduled</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              No deadlines or air dates found in your projects.
              <br />
              Start by adding episodes with schedules.
            </p>
            <Button>Add Episode</Button>
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
