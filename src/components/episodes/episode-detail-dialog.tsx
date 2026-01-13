"use client";

import { useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar, Clock, FileText, Film, ListTodo, Loader2, Pencil, Target, Trash2, Tv, User, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { type CreateEpisodeInput, type UpdateEpisodeInput, deleteEpisode, updateEpisode } from "@/server/episode-actions";

const episodeSchema = z.object({
  episode_number: z.coerce.number().min(1),
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

interface Episode {
  id: string;
  project_name: string;
  episode_number: number;
  episode_title: string;
  description: string | null;
  season: number | null;
  genre: string | null;
  current_stage: string;
  status: string;
  priority: string;
  progress_percentage: number;
  deadline: string | null;
  air_time: string | null;
  air_date: string | null;
  channel_tv: string | null;
  editor_name: string | null;
  notes: string | null;
  segments: {
    segment_number: number;
    cut_percent: number;
    audio_percent: number;
    graphics_percent: number;
    master_percent: number;
  }[];
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
}

interface EpisodeDetailDialogProps {
  episode: Episode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRole: string;
}

const STAGE_CONFIG: Record<string, { label: string; color: string; bgColor: string }> = {
  shooting: { label: "Shooting", color: "text-blue-700", bgColor: "bg-blue-100" },
  editing: { label: "Editing", color: "text-purple-700", bgColor: "bg-purple-100" },
  review: { label: "Review", color: "text-orange-700", bgColor: "bg-orange-100" },
  delivered: { label: "Delivered", color: "text-green-700", bgColor: "bg-green-100" },
  g_drive: { label: "G-Drive", color: "text-teal-700", bgColor: "bg-teal-100" },
};

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pre_production: { label: "Pre-Production", variant: "secondary" },
  shooting: { label: "Shooting", variant: "default" },
  editing: { label: "Editing", variant: "default" },
  delivered: { label: "Delivered", variant: "outline" },
    payment: { label: "Payment", variant: "outline" },
};

const PRIORITY_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> =
  {
    urgent: { label: "Urgent", variant: "destructive" },
    normal: { label: "Normal", variant: "secondary" },
    low: { label: "Low", variant: "outline" },
  };

const SEGMENT_STEPS = [
  { value: 0, label: "Not started" },
  { value: 25, label: "Rafkat 25%" },
  { value: 50, label: "Audio 50%" },
  { value: 75, label: "Grafik 75%" },
  { value: 100, label: "Mastering 100%" },
];

type SegmentState = { segment_number: number; value: number };

function segmentValueFromData(seg: Episode["segments"][number]) {
  if (!seg) return 0;
  if (seg.master_percent >= 100) return 100;
  if (seg.graphics_percent >= 100) return 75;
  if (seg.audio_percent >= 100) return 50;
  if (seg.cut_percent >= 100) return 25;
  return 0;
}

function segmentDataFromValue(value: number, segment_number: number) {
  return {
    segment_number,
    // Each step completes one stage at 100% so the average reflects the milestone (25/50/75/100)
    cut_percent: value >= 25 ? 100 : 0,
    audio_percent: value >= 50 ? 100 : 0,
    graphics_percent: value >= 75 ? 100 : 0,
    master_percent: value >= 100 ? 100 : 0,
  };
}

function segmentLabel(value: number) {
  const match = SEGMENT_STEPS.find((step) => step.value === value);
  return match?.label || `${value}%`;
}

export function EpisodeDetailDialog({ episode, open, onOpenChange, userRole }: EpisodeDetailDialogProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);

  const canEdit = userRole === "admin" || userRole === "production";
  const canDelete = userRole === "admin";

  const stageConfig = STAGE_CONFIG[episode.current_stage] || STAGE_CONFIG.shooting;
  const statusConfig = STATUS_CONFIG[episode.status] || STATUS_CONFIG.pre_production;
  const priorityConfig = PRIORITY_CONFIG[episode.priority] || PRIORITY_CONFIG.normal;

  const form = useForm<EpisodeFormValues>({
    resolver: zodResolver(episodeSchema),
    defaultValues: {
      episode_number: episode.episode_number,
      season: episode.season || 1,
      title: episode.episode_title || "",
      description: episode.description || "",
      status: (episode.status as any) || "pre_production",
      priority: (episode.priority as any) || "normal",
      channel_tv: episode.channel_tv || "",
      air_time: episode.air_time || "",
      air_date: episode.air_date || "",
      editor_name: episode.editor_name || "",
      target_delivery_date: episode.deadline || "",
      notes: episode.notes || "",
    },
  });

  const initialSegments = useMemo<SegmentState[]>(() => {
    return [1, 2, 3].map((num) => {
      const found = episode.segments?.find((s) => s.segment_number === num);
      return { segment_number: num, value: segmentValueFromData(found as any) };
    });
  }, [episode.segments, open]);

  const [segmentsState, setSegmentsState] = useState<SegmentState[]>(initialSegments);

  useEffect(() => {
    setSegmentsState(initialSegments);
  }, [initialSegments]);

  function handleSegmentChange(segment_number: number, value: number) {
    const clamped = Math.max(0, Math.min(100, value));
    setSegmentsState((prev) => prev.map((seg) => (seg.segment_number === segment_number ? { ...seg, value: clamped } : seg)));
  }

  async function onSubmit(values: EpisodeFormValues) {
    setIsLoading(true);
    try {
      console.log("[EpisodeDetailDialog] Form values:", values);
      console.log("[EpisodeDetailDialog] Status from form:", values.status);
      const segmentPayload = segmentsState.map((seg) => segmentDataFromValue(seg.value, seg.segment_number));
      const payload: UpdateEpisodeInput = { ...values, segments: segmentPayload };
      console.log("[EpisodeDetailDialog] Payload to send:", payload);
      console.log("[EpisodeDetailDialog] Episode ID:", episode.id);
      console.log("[EpisodeDetailDialog] Calling updateEpisode...");
      const result = await updateEpisode(episode.id, payload);
      console.log("[EpisodeDetailDialog] Result from server:", result);
      if (result.success) {
        toast.success("Episode updated successfully!");
        setIsEditing(false);
        router.refresh();
      } else {
        console.error("[EpisodeDetailDialog] Update failed:", result.error);
        toast.error(result.error || "Failed to update episode");
      }
    } catch (error) {
      console.error("[EpisodeDetailDialog] Exception:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setIsLoading(true);
    try {
      const result = await deleteEpisode(episode.id);
      if (result.success) {
        toast.success("Episode deleted successfully!");
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete episode");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
      setShowDeleteAlert(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-2xl font-semibold leading-tight">
                  {episode.episode_title || `Episode ${episode.episode_number}`}
                </DialogTitle>
                <DialogDescription className="text-sm">
                  {episode.project_name} · E{episode.episode_number}
                  {episode.season && ` S${episode.season}`}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && !isEditing && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
                {canDelete && (
                  <Button variant="destructive" size="sm" onClick={() => setShowDeleteAlert(true)}>
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </DialogHeader>

          {isEditing ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="episode_number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Episode #</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Brief description of the episode..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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

                <div className="rounded-lg border border-border/50 bg-muted/40 p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">Editing Segments</span>
                    <span className="text-xs text-muted-foreground">Rafkat → Audio → Grafik → Mastering</span>
                  </div>
                  {segmentsState.map((seg) => (
                    <div key={seg.segment_number} className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Segmen {seg.segment_number}</span>
                        <span className="font-medium text-foreground">{segmentLabel(seg.value)}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={25}
                        value={seg.value}
                        onChange={(e) => handleSegmentChange(seg.segment_number, Number(e.target.value))}
                        className="w-full accent-foreground"
                      />
                      <div className="flex justify-between text-[10px] text-muted-foreground">
                        {SEGMENT_STEPS.map((step) => (
                          <span key={step.value}>{step.value}%</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea rows={2} placeholder="Any additional notes..." className="resize-none" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4 mt-4">
                {/* Status Badges */}
                <div className="flex flex-wrap gap-2">
                  <Badge className={cn(stageConfig.bgColor, stageConfig.color)}>{stageConfig.label}</Badge>
                  <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                  <Badge variant={priorityConfig.variant}>{priorityConfig.label}</Badge>
                  {episode.genre && <Badge variant="outline">{episode.genre}</Badge>}
                </div>

                {episode.description && (
                  <div className="space-y-2 rounded-lg border border-border/50 bg-muted/40 p-3">
                    <div className="text-sm font-semibold text-foreground">Description</div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{episode.description}</p>
                  </div>
                )}

                {episode.notes && (
                  <div className="space-y-2 rounded-lg border border-border/50 bg-muted/40 p-3">
                    <div className="text-sm font-semibold text-foreground">Notes</div>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{episode.notes}</p>
                  </div>
                )}

                <div className="space-y-2 rounded-lg border border-border/50 bg-muted/30 p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">Editing Segments</span>
                    <span className="text-xs text-muted-foreground">Rafkat → Audio → Grafik → Mastering</span>
                  </div>
                  <div className="grid gap-2">
                    {segmentsState.map((seg) => (
                      <div key={seg.segment_number} className="space-y-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Segmen {seg.segment_number}</span>
                          <span className="font-medium text-foreground">{segmentLabel(seg.value)}</span>
                        </div>
                        <Progress value={seg.value} className="h-2" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Overall Progress</span>
                    <span className="font-semibold">{episode.progress_percentage}%</span>
                  </div>
                  <Progress value={episode.progress_percentage} className="h-3" />
                </div>

                {/* Tasks Summary */}
                <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{episode.completed_tasks}</div>
                    <div className="text-xs text-muted-foreground">Completed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{episode.in_progress_tasks}</div>
                    <div className="text-xs text-muted-foreground">In Progress</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">{episode.pending_tasks}</div>
                    <div className="text-xs text-muted-foreground">Pending</div>
                  </div>
                </div>

                {/* Quick Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Target Delivery</div>
                      <div className="text-sm font-medium">
                        {episode.deadline ? (
                          new Date(episode.deadline).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        ) : (
                          <span className="italic opacity-60">Belum ditentukan</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="text-xs text-muted-foreground">Air Date</div>
                      <div className="text-sm font-medium">
                        {episode.air_date ? (
                          <>
                            {new Date(episode.air_date).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                            {episode.air_time && ` @ ${episode.air_time}`}
                          </>
                        ) : (
                          <span className="italic opacity-60">Belum dijadwalkan</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4 mt-4">
                <div className="grid gap-4">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Description</div>
                      <div className="text-sm text-muted-foreground leading-relaxed">
                        {episode.description || (
                          <span className="italic opacity-60">Belum ada deskripsi</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Tv className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Channel TV</div>
                      <div className="text-sm text-muted-foreground">
                        {episode.channel_tv || (
                          <span className="italic opacity-60">Belum ditentukan</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Editor</div>
                      <div className="text-sm text-muted-foreground">
                        {episode.editor_name || (
                          <span className="italic opacity-60">Belum ditentukan</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium">Notes</div>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {episode.notes || (
                          <span className="italic opacity-60">Belum ada catatan</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete episode {episode.episode_number}
              {episode.season && ` (Season ${episode.season})`} from {episode.project_name}. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Episode
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
