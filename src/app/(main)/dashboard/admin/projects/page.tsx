import { Suspense } from "react";

import { redirect } from "next/navigation";

import { CheckCircle2, Film, FolderKanban, TrendingUp } from "lucide-react";

import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import type { Project, TeamMember } from "./_components";
import { ProjectCard } from "./_components";

// Fetch all projects with episode statistics
async function getAllProjects() {
  const supabaseAdmin = createSupabaseAdmin();

  const { data: projects, error: projectsError } = await supabaseAdmin
    .from("projects")
    .select(
      `
      *,
      episodes!left (
        id,
        status,
        episode_stage_segments!left (
          stage,
          segment_number,
          cut_percent,
          audio_percent,
          graphics_percent,
          master_percent
        )
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (projectsError) {
    console.error("Error fetching projects:", projectsError);
    return [];
  }

  const processedProjects: Project[] =
    projects?.map((project) => {
      const episodes = project.episodes || [];
      const totalEpisodes = episodes.length;
      const completedEpisodes = episodes.filter((ep: { status: string }) => ep.status === "delivered").length;

      const totalProgress = episodes.reduce((sum: number, ep: any) => {
        const segmentsRaw = ep.episode_stage_segments || [];
        const editingSegments = [1, 2, 3].map((num) => {
          const found = segmentsRaw.find(
            (s: any) => s.segment_number === num && s.stage === "editing",
          );

          return {
            cut: found?.cut_percent || 0,
            audio: found?.audio_percent || 0,
            graphics: found?.graphics_percent || 0,
            master: found?.master_percent || 0,
          };
        });

        const segmentAverages = editingSegments.map(
          (seg) => (seg.cut + seg.audio + seg.graphics + seg.master) / 4,
        );

        const episodeProgress =
          segmentAverages.length > 0
            ? Math.round(segmentAverages.reduce((s, val) => s + val, 0) / segmentAverages.length)
            : 0;

        return sum + episodeProgress;
      }, 0);

      const avgProgress = totalEpisodes > 0 ? Math.round(totalProgress / totalEpisodes) : 0;

      return {
        id: project.id,
        title: project.title,
        type: project.type,
        status: project.status,
        total_budget: project.total_budget,
        start_date: project.start_date,
        target_completion_date: project.target_completion_date,
        description: project.description,
        created_at: project.created_at,
        total_episodes: totalEpisodes,
        completed_episodes: completedEpisodes,
        avg_progress: avgProgress,
      };
    }) || [];

  return processedProjects;
}

async function getProjectTeam(projectId: string): Promise<TeamMember[]> {
  const supabaseAdmin = createSupabaseAdmin();

  const { data, error } = await supabaseAdmin
    .from("user_projects")
    .select(
      `
      user_id,
      users!inner (
        full_name,
        email,
        role
      )
    `,
    )
    .eq("project_id", projectId);

  if (error) {
    console.error("Error fetching project team:", error);
    return [];
  }

  return (
    // biome-ignore lint/suspicious/noExplicitAny: Supabase join returns complex type
    data?.map((item: any) => ({
      user_id: item.user_id,
      full_name: item.users.full_name,
      email: item.users.email,
      role: item.users.role,
      profile_picture: null,
    })) || []
  );
}

function ProjectStats({ projects }: { projects: Project[] }) {
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const avgProgress =
    totalProjects > 0 ? Math.round(projects.reduce((sum, p) => sum + p.avg_progress, 0) / totalProjects) : 0;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
          <CardTitle className="text-xs font-medium text-muted-foreground">Total Projects</CardTitle>
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-2xl font-bold">{totalProjects}</div>
          <p className="text-[10px] text-muted-foreground">All projects in system</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
          <CardTitle className="text-xs font-medium text-muted-foreground">Active Projects</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-2xl font-bold">{activeProjects}</div>
          <p className="text-[10px] text-muted-foreground">Currently in progress</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
          <CardTitle className="text-xs font-medium text-muted-foreground">Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-2xl font-bold">{completedProjects}</div>
          <p className="text-[10px] text-muted-foreground">
            {totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0}% completion rate
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-purple-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3">
          <CardTitle className="text-xs font-medium text-muted-foreground">Avg Progress</CardTitle>
          <Film className="h-4 w-4 text-purple-500" />
        </CardHeader>
        <CardContent className="pb-3">
          <div className="text-2xl font-bold">{avgProgress}%</div>
          <Progress value={avgProgress} className="mt-1 h-1.5" />
        </CardContent>
      </Card>
    </div>
  );
}

async function ProjectsList({ userRole }: { userRole: string }) {
  const projects = await getAllProjects();

  const projectsWithTeams = await Promise.all(
    projects.map(async (project) => {
      const teamMembers = await getProjectTeam(project.id);
      return { project, teamMembers };
    }),
  );

  if (projects.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FolderKanban className="mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No Projects Yet</h3>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Create your first project to get started with production tracking.
          </p>
          <CreateProjectDialog />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {projectsWithTeams.map(({ project, teamMembers }) => (
        <ProjectCard key={project.id} project={project} teamMembers={teamMembers} userRole={userRole} />
      ))}
    </div>
  );
}

function ProjectsListSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <div className="flex gap-1.5">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-14" />
            </div>
            <Skeleton className="mt-2 h-5 w-full" />
            <Skeleton className="mt-1 h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Skeleton className="mb-1.5 h-3 w-20" />
              <Skeleton className="h-1.5 w-full" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="flex justify-between">
              <Skeleton className="h-3 w-12" />
              <div className="flex -space-x-1.5">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-8 flex-1" />
              <Skeleton className="h-8 flex-1" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProjectsStatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-1 pt-3">
            <Skeleton className="h-3 w-20" />
          </CardHeader>
          <CardContent className="pb-3">
            <Skeleton className="mb-1 h-7 w-12" />
            <Skeleton className="h-2.5 w-24" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default async function AdminProjectsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: userProfile } = await supabase.from("users").select("role").eq("id", user.id).single();

  // Admin and production can access this page
  if (!userProfile?.role || !["admin", "production"].includes(userProfile.role)) {
    redirect("/unauthorized");
  }

  const projects = await getAllProjects();
  const userRole = userProfile.role;

  return (
    <div className="space-y-4">
      {/* Header - Compact */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects Management</h1>
          <p className="text-sm text-muted-foreground">Manage and monitor all production projects</p>
        </div>
        <CreateProjectDialog />
      </div>

      {/* Stats - Compact */}
      <Suspense fallback={<ProjectsStatsSkeleton />}>
        <ProjectStats projects={projects} />
      </Suspense>

      {/* Projects Grid - Optimized for 15" screen */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">All Projects ({projects.length})</h2>
        <Suspense fallback={<ProjectsListSkeleton />}>
          <ProjectsList userRole={userRole} />
        </Suspense>
      </div>
    </div>
  );
}
