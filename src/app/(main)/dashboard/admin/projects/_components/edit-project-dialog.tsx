"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { updateProject } from "@/server/project-actions";

const projectSchema = z.object({
  title: z.string().min(1, "Project title is required").max(255),
  description: z.string().optional(),
  type: z.enum(["film", "series", "documentary", "variety"], {
    required_error: "Please select a project type",
  }),
  genre: z.string().optional(),
  total_budget: z.coerce.number().min(0).optional(),
  start_date: z.string().optional(),
  target_completion_date: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectSchema>;

interface Project {
  id: string;
  project_name: string;
  project_type: string;
  status: string;
  budget: number | null;
  start_date: string | null;
  target_completion: string | null;
  description: string | null;
}

interface EditProjectDialogProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditProjectDialog({ project, open, onOpenChange }: EditProjectDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      type: "series",
      genre: "",
      total_budget: 0,
      start_date: "",
      target_completion_date: "",
    },
  });

  // Reset form when dialog opens with project data
  useEffect(() => {
    if (open) {
      form.reset({
        title: project.project_name || "",
        description: project.description || "",
        type: (project.project_type as "film" | "series" | "documentary" | "variety") || "series",
        genre: "",
        total_budget: project.budget || 0,
        start_date: project.start_date || "",
        target_completion_date: project.target_completion || "",
      });
    }
  }, [open, project, form]);

  async function onSubmit(values: ProjectFormValues) {
    setIsLoading(true);

    try {
      const result = await updateProject(project.id, values);

      if (result.success) {
        toast.success("Project updated successfully!");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to update project");
      }
    } catch (error) {
      console.error("Update project error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" />
            Edit Project
          </DialogTitle>
          <DialogDescription>Update the details of "{project.project_name}".</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Project Title *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Web Series: Journey" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="film">Film</SelectItem>
                        <SelectItem value="series">Series</SelectItem>
                        <SelectItem value="documentary">Documentary</SelectItem>
                        <SelectItem value="variety">Variety Show</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Genre</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Drama, Comedy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe the project..." className="resize-none" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_completion_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Completion</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="total_budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Budget (IDR)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" step="1000000" placeholder="0" {...field} />
                  </FormControl>
                  <FormDescription>Total project budget in Indonesian Rupiah</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
