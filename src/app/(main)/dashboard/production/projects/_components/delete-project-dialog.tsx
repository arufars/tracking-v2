"use client";

import { useState } from "react";

import { useRouter } from "next/navigation";

import { AlertTriangle, Archive, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { archiveProject, deleteProject } from "@/server/project-actions";

interface DeleteProjectDialogProps {
  projectId: string;
  projectName: string;
  userRole: "production" | "admin";
  trigger?: React.ReactNode;
}

export function DeleteProjectDialog({ projectId, projectName, userRole, trigger }: DeleteProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState<"archive" | "delete">("archive");

  const canDelete = userRole === "admin";

  async function handleAction() {
    setIsLoading(true);

    try {
      let result;
      if (action === "delete" && canDelete) {
        result = await deleteProject(projectId);
      } else {
        result = await archiveProject(projectId);
      }

      if (result.success) {
        toast.success(action === "delete" ? "Project deleted successfully!" : "Project archived successfully!");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error || `Failed to ${action} project`);
      }
    } catch (error) {
      console.error(`${action} project error:`, error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
            <Archive className="mr-2 h-4 w-4" />
            {canDelete ? "Delete" : "Archive"}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            {canDelete ? "Delete or Archive Project?" : "Archive Project?"}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <span className="block">
              You are about to {canDelete ? "delete or archive" : "archive"} the project:{" "}
              <strong className="text-foreground">{projectName}</strong>
            </span>
            {canDelete ? (
              <span className="block text-destructive font-medium">
                Deleting a project will permanently remove all associated episodes, stages, and data. This action cannot
                be undone.
              </span>
            ) : (
              <span className="block">
                Archiving will hide the project from active lists but preserve all data. You can restore it later.
              </span>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="sm:flex-col sm:space-y-2 sm:space-x-0">
          {canDelete && (
            <div className="flex gap-2 w-full">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setAction("archive");
                  handleAction();
                }}
                disabled={isLoading}
              >
                {isLoading && action === "archive" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Archive className="mr-2 h-4 w-4" />
                Archive Only
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => {
                  setAction("delete");
                  handleAction();
                }}
                disabled={isLoading}
              >
                {isLoading && action === "delete" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Permanently
              </Button>
            </div>
          )}
          {!canDelete && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                setAction("archive");
                handleAction();
              }}
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Archive className="mr-2 h-4 w-4" />
              Archive Project
            </Button>
          )}
          <AlertDialogCancel className="w-full mt-2" disabled={isLoading}>
            Cancel
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
