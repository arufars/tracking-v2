"use client";

import { useEffect, useMemo, useState } from "react";

import { useSearchParams } from "next/navigation";

import { ArrowUpDown, LayoutGrid, List, Search, SlidersHorizontal, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

import { EpisodeCard } from "./episode-card";

interface Episode {
  id: string;
  project_id: string;
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
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  in_progress_tasks: number;
}

interface EpisodeFiltersProps {
  episodes: Episode[];
  userRole: string;
}

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "pre_production", label: "Pre-Production" },
  { value: "shooting", label: "Shooting" },
  { value: "editing", label: "Editing" },
  { value: "delivered", label: "Delivered" },
  { value: "payment", label: "Payment" },
];

const PRIORITY_OPTIONS = [
  { value: "all", label: "All Priority" },
  { value: "urgent", label: "Urgent" },
  { value: "normal", label: "Normal" },
  { value: "low", label: "Low" },
];

const SORT_OPTIONS = [
  { value: "deadline-asc", label: "Deadline (Soonest)" },
  { value: "deadline-desc", label: "Deadline (Latest)" },
  { value: "progress-asc", label: "Progress (Low to High)" },
  { value: "progress-desc", label: "Progress (High to Low)" },
  { value: "episode-asc", label: "Episode (1-99)" },
  { value: "episode-desc", label: "Episode (99-1)" },
  { value: "project", label: "Project Name" },
];

export function EpisodeFilters({ episodes, userRole }: EpisodeFiltersProps) {
  const searchParams = useSearchParams();
  const projectFromUrl = searchParams.get("project");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sortBy, setSortBy] = useState("deadline-asc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Get unique projects for quick filter
  const projects = useMemo(() => {
    const projectSet = new Set(episodes.map((e) => e.project_name));
    return Array.from(projectSet);
  }, [episodes]);

  const [projectFilter, setProjectFilter] = useState("all");

  // Auto-select project from URL parameter
  useEffect(() => {
    if (projectFromUrl) {
      // Find episode with matching project ID
      const matchingEpisode = episodes.find((e) => e.project_id === projectFromUrl);
      if (matchingEpisode) {
        setProjectFilter(matchingEpisode.project_name);
      }
    }
  }, [projectFromUrl, episodes]);

  // Filter and sort episodes
  const filteredEpisodes = useMemo(() => {
    let result = [...episodes];

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.episode_title.toLowerCase().includes(searchLower) ||
          e.project_name.toLowerCase().includes(searchLower) ||
          `e${e.episode_number}`.includes(searchLower) ||
          (e.editor_name && e.editor_name.toLowerCase().includes(searchLower)),
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((e) => e.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== "all") {
      result = result.filter((e) => e.priority === priorityFilter);
    }

    // Project filter
    if (projectFilter !== "all") {
      result = result.filter((e) => e.project_name === projectFilter);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "deadline-asc":
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        case "deadline-desc":
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
        case "progress-asc":
          return a.progress_percentage - b.progress_percentage;
        case "progress-desc":
          return b.progress_percentage - a.progress_percentage;
        case "episode-asc":
          return a.episode_number - b.episode_number;
        case "episode-desc":
          return b.episode_number - a.episode_number;
        case "project":
          return a.project_name.localeCompare(b.project_name);
        default:
          return 0;
      }
    });

    return result;
  }, [episodes, search, statusFilter, priorityFilter, projectFilter, sortBy]);

  const activeFiltersCount = [statusFilter !== "all", priorityFilter !== "all", projectFilter !== "all"].filter(
    Boolean,
  ).length;

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPriorityFilter("all");
    setProjectFilter("all");
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search episodes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-9"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-32 h-9">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {PRIORITY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {projects.length > 1 && (
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-40 h-9">
                <SelectValue placeholder="Project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Projects</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 h-9">
              <ArrowUpDown className="h-3.5 w-3.5 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="h-9 px-2.5 rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="h-9 px-2.5 rounded-l-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {statusFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Status: {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}
              <button onClick={() => setStatusFilter("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {priorityFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Priority: {PRIORITY_OPTIONS.find((o) => o.value === priorityFilter)?.label}
              <button onClick={() => setPriorityFilter("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {projectFilter !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Project: {projectFilter}
              <button onClick={() => setProjectFilter("all")}>
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-6 px-2 text-xs">
            Clear all
          </Button>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredEpisodes.length} of {episodes.length} episodes
        </p>
      </div>

      {/* Episodes Grid/List */}
      {filteredEpisodes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <SlidersHorizontal className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No episodes found</h3>
          <p className="text-sm text-muted-foreground mb-4">Try adjusting your filters or search terms</p>
          <Button variant="outline" onClick={clearFilters}>
            Clear filters
          </Button>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" : "flex flex-col gap-3",
          )}
        >
          {filteredEpisodes.map((episode) => (
            <EpisodeCard key={episode.id} episode={episode} userRole={userRole} />
          ))}
        </div>
      )}
    </div>
  );
}
