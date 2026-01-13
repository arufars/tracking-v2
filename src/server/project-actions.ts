"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CreateProjectInput {
  title: string;
  description?: string;
  type: "film" | "series" | "documentary" | "variety";
  genre?: string;
  total_budget?: number;
  start_date?: string;
  target_completion_date?: string;
}

export async function createProject(input: CreateProjectInput) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Auth error:", userError);
      return {
        success: false,
        error: "Unauthorized. Please login.",
      };
    }

    console.log("Current user:", user.id, user.email);

    // Check user role
    const { data: userData, error: roleError } = await supabase.from("users").select("role").eq("id", user.id).single();

    if (roleError || !userData) {
      return {
        success: false,
        error: "Failed to verify user role.",
      };
    }

    // Only admin and production can create projects
    if (!["admin", "production"].includes(userData.role)) {
      return {
        success: false,
        error: "You do not have permission to create projects.",
      };
    }

    // Create project - Use admin client to bypass RLS
    // This is necessary because auth.uid() returns NULL in server context
    const supabaseAdmin = createSupabaseAdmin();

    console.log("[DEBUG] Using admin client with service role key");
    console.log("[DEBUG] Service key starts with:", process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 50));

    const { data: project, error: projectError } = await supabaseAdmin
      .from("projects")
      .insert({
        title: input.title,
        description: input.description,
        type: input.type,
        genre: input.genre,
        total_budget: input.total_budget || 0,
        start_date: input.start_date,
        target_completion_date: input.target_completion_date,
        status: "active",
        created_by: user.id,
      })
      .select()
      .single();

    if (projectError) {
      console.error("Project creation error:", projectError);
      return {
        success: false,
        error: projectError.message || "Failed to create project. Please try again.",
      };
    }

    // Assign creator to project - Also use admin client
    const { error: assignError } = await supabaseAdmin.from("user_projects").insert({
      user_id: user.id,
      project_id: project.id,
      access_level: "admin",
      team_role: userData.role === "admin" ? "admin" : "production_manager",
    });

    if (assignError) {
      console.error("User assignment error:", assignError);
      // Project created but assignment failed - log warning but don't fail
      console.warn("Warning: Project created but user assignment failed. User may need to be manually assigned.");
    }

    revalidatePath("/dashboard/production/projects");
    revalidatePath("/dashboard/admin/projects");

    return {
      success: true,
      data: project,
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

export async function updateProject(projectId: string, input: Partial<CreateProjectInput>) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "Unauthorized. Please login.",
      };
    }

    // Check user role
    const { data: userData, error: roleError } = await supabase.from("users").select("role").eq("id", user.id).single();

    if (roleError || !userData) {
      return {
        success: false,
        error: "Failed to verify user role.",
      };
    }

    // Only admin and production can update projects
    if (!["admin", "production"].includes(userData.role)) {
      return {
        success: false,
        error: "You do not have permission to update projects.",
      };
    }

    // Update project
    const { data: project, error: updateError } = await supabase
      .from("projects")
      .update({
        title: input.title,
        description: input.description,
        type: input.type,
        genre: input.genre,
        total_budget: input.total_budget,
        start_date: input.start_date,
        target_completion_date: input.target_completion_date,
      })
      .eq("id", projectId)
      .select()
      .single();

    if (updateError) {
      console.error("Project update error:", updateError);
      return {
        success: false,
        error: "Failed to update project. Please try again.",
      };
    }

    revalidatePath("/dashboard/production/projects");
    revalidatePath("/dashboard/admin/projects");

    return {
      success: true,
      data: project,
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

export async function deleteProject(projectId: string) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "Unauthorized. Please login.",
      };
    }

    // Check user role
    const { data: userData, error: roleError } = await supabase.from("users").select("role").eq("id", user.id).single();

    if (roleError || !userData) {
      return {
        success: false,
        error: "Failed to verify user role.",
      };
    }

    // Only admin can delete projects (production can only archive)
    if (userData.role !== "admin") {
      return {
        success: false,
        error: "Only administrators can delete projects. Use archive instead.",
      };
    }

    // Delete project (cascade will handle related records)
    const { error: deleteError } = await supabase.from("projects").delete().eq("id", projectId);

    if (deleteError) {
      console.error("Project deletion error:", deleteError);
      return {
        success: false,
        error: "Failed to delete project. Please try again.",
      };
    }

    revalidatePath("/dashboard/production/projects");
    revalidatePath("/dashboard/admin/projects");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

export async function archiveProject(projectId: string) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "Unauthorized. Please login.",
      };
    }

    // Check user role
    const { data: userData, error: roleError } = await supabase.from("users").select("role").eq("id", user.id).single();

    if (roleError || !userData) {
      return {
        success: false,
        error: "Failed to verify user role.",
      };
    }

    // Admin and production can archive
    if (!["admin", "production"].includes(userData.role)) {
      return {
        success: false,
        error: "You do not have permission to archive projects.",
      };
    }

    // Archive project
    const { error: archiveError } = await supabase.from("projects").update({ status: "archived" }).eq("id", projectId);

    if (archiveError) {
      console.error("Project archive error:", archiveError);
      return {
        success: false,
        error: "Failed to archive project. Please try again.",
      };
    }

    revalidatePath("/dashboard/production/projects");
    revalidatePath("/dashboard/admin/projects");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}
