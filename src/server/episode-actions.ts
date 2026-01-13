"use server";

import { revalidatePath } from "next/cache";

import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface CreateEpisodeInput {
  project_id: string;
  episode_number: number;
  season?: number;
  title?: string;
  description?: string;
  status?: "pre_production" | "shooting" | "pre_editing" | "editing" | "delivered";
  priority?: "urgent" | "normal" | "low";
  channel_tv?: string;
  air_time?: string;
  air_date?: string;
  editor_name?: string;
  target_delivery_date?: string;
  notes?: string;
}

export interface SegmentProgressInput {
  segment_number: number;
  cut_percent: number;
  audio_percent: number;
  graphics_percent: number;
  master_percent: number;
}

export interface UpdateEpisodeInput extends Partial<CreateEpisodeInput> {
  segments?: SegmentProgressInput[];
}

export async function createEpisode(input: CreateEpisodeInput) {
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

    // Only admin and production can create episodes
    if (!["admin", "production"].includes(userData.role)) {
      return {
        success: false,
        error: "You do not have permission to create episodes.",
      };
    }

    // Check user has access to the project
    const { data: projectAccess } = await supabase
      .from("user_projects")
      .select("id")
      .eq("user_id", user.id)
      .eq("project_id", input.project_id)
      .single();

    if (!projectAccess) {
      return {
        success: false,
        error: "You do not have access to this project.",
      };
    }

    // Use admin client to bypass RLS
    const supabaseAdmin = createSupabaseAdmin();

    // Create episode
    const { data: episode, error: episodeError } = await supabaseAdmin
      .from("episodes")
      .insert({
        project_id: input.project_id,
        episode_number: input.episode_number,
        season: input.season || 1,
        title: input.title,
        description: input.description,
        status: input.status || "pre_production",
        priority: input.priority || "normal",
        channel_tv: input.channel_tv,
        air_time: input.air_time,
        air_date: input.air_date,
        editor_name: input.editor_name,
        target_delivery_date: input.target_delivery_date,
        notes: input.notes,
      })
      .select()
      .single();

    if (episodeError) {
      console.error("Episode creation error:", episodeError);
      return {
        success: false,
        error: episodeError.message || "Failed to create episode.",
      };
    }

    // Note: Stages are auto-created via trigger (create_episode_structure)

    // Pre-create empty segment progress for editing (3 segments, 4 sub-tasks)
    const defaultSegments = [1, 2, 3].map((segment) => ({
      episode_id: episode.id,
      stage: "editing",
      segment_number: segment,
      cut_percent: 0,
      audio_percent: 0,
      graphics_percent: 0,
      master_percent: 0,
    }));

    const { error: segmentsError } = await supabaseAdmin.from("episode_stage_segments").insert(defaultSegments);

    if (segmentsError) {
      console.error("Segment initialization error:", segmentsError);
    }

    revalidatePath("/dashboard/production/episodes");
    revalidatePath("/dashboard/production/projects");

    return {
      success: true,
      data: episode,
    };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "An unexpected error occurred.",
    };
  }
}

export async function updateEpisode(episodeId: string, input: UpdateEpisodeInput) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { success: false, error: "Unauthorized." };
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();

    if (!userData || !["admin", "production"].includes(userData.role)) {
      return { success: false, error: "Permission denied." };
    }

    const supabaseAdmin = createSupabaseAdmin();

    console.log("[updateEpisode] Updating episode:", episodeId, "with status:", input.status);

    // Build update object - only include defined fields
    const updateData: Record<string, any> = {};
    if (input.episode_number !== undefined) updateData.episode_number = input.episode_number;
    if (input.season !== undefined) updateData.season = input.season;
    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.channel_tv !== undefined) updateData.channel_tv = input.channel_tv;
    if (input.air_time !== undefined) updateData.air_time = input.air_time;
    if (input.air_date !== undefined) updateData.air_date = input.air_date;
    if (input.editor_name !== undefined) updateData.editor_name = input.editor_name;
    if (input.target_delivery_date !== undefined) updateData.target_delivery_date = input.target_delivery_date;
    if (input.notes !== undefined) updateData.notes = input.notes;

    console.log("[updateEpisode] Update data:", updateData);

    // STEP 1: Handle segment progress FIRST (before main update)
    const segments = input.segments;
    const statusToSet = updateData.status; // Save status before any trigger can change it

    if (segments && segments.length > 0) {
      const cleaned = segments.map((s) => ({
        episode_id: episodeId,
        stage: "editing",
        segment_number: s.segment_number,
        cut_percent: clampPercent(s.cut_percent),
        audio_percent: clampPercent(s.audio_percent),
        graphics_percent: clampPercent(s.graphics_percent),
        master_percent: clampPercent(s.master_percent),
      }));

      const { error: upsertError } = await supabaseAdmin
        .from("episode_stage_segments")
        .upsert(cleaned, { onConflict: "episode_id,stage,segment_number" });

      if (upsertError) {
        console.error("Segment upsert error:", upsertError);
        return { success: false, error: "Failed to save segment progress." };
      }

      console.log("[updateEpisode] Segments updated successfully");
    }

    // STEP 2: Update main episode fields
    const { data: episode, error } = await supabaseAdmin
      .from("episodes")
      .update(updateData)
      .eq("id", episodeId)
      .select()
      .single();

    if (error) {
      console.error("[updateEpisode] DB error:", error);
      return { success: false, error: error.message };
    }

    console.log("[updateEpisode] Updated episode:", episode);

    // STEP 3: CRITICAL - Re-assert status if it was provided (prevent trigger overwrite)
    if (statusToSet !== undefined) {
      console.log("[updateEpisode] Re-asserting status:", statusToSet);
      
      const { data: finalEpisode, error: finalError } = await supabaseAdmin
        .from("episodes")
        .update({ status: statusToSet })
        .eq("id", episodeId)
        .select("id, status, title")
        .single();

      if (finalError) {
        console.error("[updateEpisode] Final status update error:", finalError);
        return { success: false, error: finalError.message };
      }
      
      console.log("[updateEpisode] FINAL status:", finalEpisode?.status);
      
      // Check if trigger reverted (no extra query needed - use response)
      if (finalEpisode && finalEpisode.status !== statusToSet) {
        console.error("[updateEpisode] STATUS REVERT! Wanted:", statusToSet, "Got:", finalEpisode.status);
        return { 
          success: false, 
          error: `Trigger reverting status. Check audit_trigger.` 
        };
      }
    }

    revalidatePath("/dashboard/production/episodes");
    revalidatePath("/live-board");
    return { success: true, data: episode };
  } catch (error) {
    return { success: false, error: "An unexpected error occurred." };
  }
}

function clampPercent(value: number | undefined) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function calculateEditingProgress(segments: SegmentProgressInput[]) {
  if (!segments || segments.length === 0) return 0;
  const segmentTotals = segments.map((s) => {
    const sum =
      clampPercent(s.cut_percent) +
      clampPercent(s.audio_percent) +
      clampPercent(s.graphics_percent) +
      clampPercent(s.master_percent);
    return Math.round(sum / 4);
  });
  const avg = segmentTotals.reduce((sum, val) => sum + val, 0) / segmentTotals.length;
  return Math.round(avg);
}

export async function deleteEpisode(episodeId: string) {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Unauthorized." };
    }

    const { data: userData } = await supabase.from("users").select("role").eq("id", user.id).single();

    // Only admin can delete
    if (!userData || userData.role !== "admin") {
      return { success: false, error: "Only admins can delete episodes." };
    }

    const supabaseAdmin = createSupabaseAdmin();

    const { error } = await supabaseAdmin.from("episodes").delete().eq("id", episodeId);

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/production/episodes");
    return { success: true };
  } catch (error) {
    return { success: false, error: "An unexpected error occurred." };
  }
}
