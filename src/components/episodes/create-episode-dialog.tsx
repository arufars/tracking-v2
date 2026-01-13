"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Film, Loader2, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { type CreateEpisodeInput, createEpisode } from "@/server/episode-actions";

const episodeSchema = z.object({
  project_id: z.string().min(1, "Please select a project"),
  episode_number: z.coerce.number().min(1, "Episode number is required"),
  season: z.coerce.number().min(1).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(["pre_production", "shooting", "editing", "delivered", "payment"]).optional(),
  priority: z.enum(["urgent", "normal", "low"]).optional(),
  channel_tv: z.string().optional(),
  air_time: z.string().optional(),
  air_date: z.string().optional(),
  editor_name: z.string().optional(),
  target_delivery_date: z.string().optional(),
  notes: z.string().optional(),
});

type EpisodeFormValues = z.infer<typeof episodeSchema>;

interface Project {
  id: string;
  title: string;
}

export function CreateEpisodeDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const form = useForm<EpisodeFormValues>({
    resolver: zodResolver(episodeSchema),
    defaultValues: {
      project_id: "",
      episode_number: 1,
      season: 1,
      title: "",
      description: "",
      status: "pre_production",
      priority: "normal",
      channel_tv: "",
      air_time: "",
      air_date: "",
      editor_name: "",
      target_delivery_date: "",
      notes: "",
    },
  });

  // Fetch user's projects when dialog opens
  useEffect(() => {
    if (open) {
      fetchProjects();
    }
  }, [open]);

  async function fetchProjects() {
    setLoadingProjects(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      // Get projects where user is a member
      const { data: userProjects } = await supabase.from("user_projects").select("project_id").eq("user_id", user.id);

      const projectIds = (userProjects as { project_id: string }[] | null)?.map((up) => up.project_id) || [];

      if (projectIds.length === 0) {
        setProjects([]);
        return;
      }

      const { data: projectsData } = await supabase
        .from("projects")
        .select("id, title")
        .in("id", projectIds)
        .order("title");

      setProjects(projectsData || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoadingProjects(false);
    }
  }

  async function onSubmit(values: EpisodeFormValues) {
    setIsLoading(true);

    try {
      const result = await createEpisode(values as CreateEpisodeInput);

      if (result.success) {
        toast.success("Episode created successfully!");
        setOpen(false);
        form.reset();
        router.refresh();
      } else {
        toast.error(result.error || "Failed to create episode");
      }
    } catch (error) {
      console.error("Create episode error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Film className="mr-2 h-4 w-4" />
          Add Episode
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Episode</DialogTitle>
          <DialogDescription>Add a new episode to one of your projects.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Project Selection */}
            <FormField
              control={form.control}
              name="project_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingProjects ? "Loading..." : "Select a project"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              {/* Episode Number */}
              <FormField
                control={form.control}
                name="episode_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Episode # *</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Season */}
              <FormField
                control={form.control}
                name="season"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Season</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Priority */}
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Episode Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Pilot, The Beginning" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pre_production">Pre-Production</SelectItem>
                      <SelectItem value="shooting">Shooting</SelectItem>
                      <SelectItem value="editing">Editing</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the episode..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Channel TV */}
              <FormField
                control={form.control}
                name="channel_tv"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Channel TV</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., MBG Network, SCTV" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Editor Name */}
              <FormField
                control={form.control}
                name="editor_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Editor</FormLabel>
                    <FormControl>
                      <Input placeholder="Assigned editor name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Air Date */}
              <FormField
                control={form.control}
                name="air_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Air Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Air Time */}
              <FormField
                control={form.control}
                name="air_time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Air Time</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Target Delivery */}
              <FormField
                control={form.control}
                name="target_delivery_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Delivery</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Any additional notes..." className="resize-none" rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || projects.length === 0}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Episode
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
