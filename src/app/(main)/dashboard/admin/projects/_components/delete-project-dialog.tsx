"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { Archive, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { archiveProject, deleteProject } from "@/server/project-actions";

interface DeleteProjectDialogProps {
  projectId: string;
  projectName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: "admin" | "production";
}

export function DeleteProjectDialog({
  projectId,
  projectName,
  open,
  onOpenChange,
  userRole,
}: DeleteProjectDialogProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = userRole === "admin";

  async function handleAction() {
    setIsLoading(true);

    try {
      // Admin can delete, production can only archive
      const result = isAdmin ? await deleteProject(projectId) : await archiveProject(projectId);

      if (result.success) {
        toast.success(isAdmin ? "Project deleted successfully!" : "Project archived successfully!");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${isAdmin ? "delete" : "archive"} project`);
      }
    } catch (error) {
      console.error(`${isAdmin ? "Delete" : "Archive"} project error:`, error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {isAdmin ? (
              <Trash2 className="h-5 w-5 text-destructive" />
            ) : (
              <Archive className="h-5 w-5 text-orange-500" />
            )}
            {isAdmin ? "Delete Project" : "Archive Project"}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              Are you sure you want to {isAdmin ? "delete" : "archive"} <strong>"{projectName}"</strong>?
            </span>
            {isAdmin ? (
              <span className="block font-medium text-destructive">
                This action cannot be undone. All related episodes, stages, and data will be permanently removed.
              </span>
            ) : (
              <span className="block text-muted-foreground">
                Archived projects can be restored by an administrator. The project will be hidden from the active list.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <Button variant={isAdmin ? "destructive" : "default"} onClick={handleAction} disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isAdmin ? "Delete Project" : "Archive Project"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
