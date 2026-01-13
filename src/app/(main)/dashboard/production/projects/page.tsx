import { redirect } from "next/navigation";

import { CheckCircle2, Film, FolderKanban, TrendingUp } from "lucide-react";
import type { Metadata } from "next";

import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { type Project, ProjectCard, type TeamMember } from "./_components/project-card";

export const metadata: Metadata = {
  title: "Production Projects",
  description: "Manage your production projects",
};

async function getProductionProjects(userId: string, role: string) {
  const supabase = await createSupabaseServerClient();

  // Production sees all projects; others stick to assigned projects via user_projects
  let projectQuery = supabase
    .from("projects")
    .select(
      `
      *,
      episodes (
        id,
        status,
        episode_stage_segments (
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

  if (role !== "production") {
    const { data: userProjects, error: userProjectsError } = await supabase
      .from("user_projects")
      .select("project_id")
      .eq("user_id", userId);

    if (userProjectsError) {
      console.error("Error fetching user projects:", userProjectsError);
      return [];
    }

    const projectIds = userProjects?.map((up) => up.project_id) || [];
    if (projectIds.length === 0) {
      return [];
    }

    projectQuery = projectQuery.in("id", projectIds);
  }

  const { data: projects, error: projectsError } = await projectQuery;

  if (projectsError) {
    console.error("Error fetching projects:", projectsError);
    return [];
  }

  // Process projects with statistics
  const processedProjects =
    projects?.map((project) => {
      const episodes = project.episodes || [];
      const totalEpisodes = episodes.length;
      const completedEpisodes = episodes.filter((ep: any) => ep.status === "delivered").length;

      // Calculate avg progress from episode_stage_segments (editing stage, 3 segments x 4 tasks)
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
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from("user_projects")
    .select(
      `
      user_id,
      users!inner (
        full_name,
        email,
        role,
        profile_picture
      )
    `,
    )
    .eq("project_id", projectId);

  if (error) {
    console.error("Error fetching project team:", error);
    return [];
  }

  return (
    data?.map((item: any) => ({
      user_id: item.user_id,
      full_name: item.users.full_name,
      email: item.users.email,
      role: item.users.role,
      profile_picture: item.users.profile_picture,
    })) || []
  );
}

function ProjectStats({ projects }: { projects: Project[] }) {
  const totalProjects = projects.length;
  const activeProjects = projects.filter((p) => p.status === "in-progress").length;
  const completedProjects = projects.filter((p) => p.status === "completed").length;
  const avgProgress =
    totalProjects > 0 ? Math.round(projects.reduce((sum, p) => sum + p.avg_progress, 0) / totalProjects) : 0;

  return (
    <div className="grid gap-4 md:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
          <FolderKanban className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProjects}</div>
          <p className="text-xs text-muted-foreground">All your projects</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{activeProjects}</div>
          <p className="text-xs text-muted-foreground">Currently in progress</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{completedProjects}</div>
          <p className="text-xs text-muted-foreground">
            {totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0}% completion rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
          <Film className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgProgress}%</div>
          <Progress value={avgProgress} className="mt-2" />
        </CardContent>
      </Card>
    </div>
  );
}

export default async function ProductionProjectsPage() {
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

  const projects = await getProductionProjects(user.id, userData.role);

  // Get team members for each project
  const projectsWithTeams = await Promise.all(
    projects.map(async (project) => {
      const teamMembers = await getProjectTeam(project.id);
      return { project, teamMembers };
    }),
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Production Projects</h1>
          <p className="text-muted-foreground">Manage and monitor all your production projects</p>
        </div>
        <CreateProjectDialog />
      </div>

      {/* Stats */}
      <ProjectStats projects={projects} />

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              You haven't been assigned to any projects yet.
              <br />
              Contact your admin to get started.
            </p>
            <Button variant="outline">Contact Admin</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projectsWithTeams.map(({ project, teamMembers }) => (
            <ProjectCard key={project.id} project={project} teamMembers={teamMembers} userRole={userData.role} />
          ))}
        </div>
      )}
    </div>
  );
}
