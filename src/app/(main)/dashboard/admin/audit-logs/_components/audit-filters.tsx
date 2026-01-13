"use client";

import { useState } from "react";

import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Calendar, Filter, Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface AuditFilters {
  search: string;
  action: string;
  entityType: string;
  userId: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

interface AuditFiltersProps {
  filters: AuditFilters;
  onFiltersChange: (filters: AuditFilters) => void;
  entityTypes: string[];
  users: Array<{ id: string; name: string }>;
}

export function AuditFiltersBar({ filters, onFiltersChange, entityTypes, users }: AuditFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const activeFiltersCount = [
    filters.action !== "all",
    filters.entityType !== "all",
    filters.userId !== "all",
    filters.dateFrom !== undefined,
    filters.dateTo !== undefined,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      search: "",
      action: "all",
      entityType: "all",
      userId: "all",
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  return (
    <div className="space-y-3">
      {/* Main search bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by user, entity, or changes..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={filters.action} onValueChange={(value) => onFiltersChange({ ...filters, action: value })}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="INSERT">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  Created
                </div>
              </SelectItem>
              <SelectItem value="UPDATE">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Updated
                </div>
              </SelectItem>
              <SelectItem value="DELETE">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  Deleted
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.entityType}
            onValueChange={(value) => onFiltersChange({ ...filters, entityType: value })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Entity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Entities</SelectItem>
              {entityTypes.map((entity) => (
                <SelectItem key={entity} value={entity}>
                  {entity.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={showAdvanced ? "secondary" : "outline"}
            size="icon"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="relative"
          >
            <Filter className="h-4 w-4" />
            {activeFiltersCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-[10px] text-primary-foreground flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="flex flex-wrap gap-3 p-3 bg-muted/50 rounded-lg">
          <Select value={filters.userId} onValueChange={(value) => onFiltersChange({ ...filters, userId: value })}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by user" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {filters.dateFrom ? format(filters.dateFrom, "dd MMM", { locale: id }) : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.dateFrom}
                onSelect={(date) => onFiltersChange({ ...filters, dateFrom: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[150px] justify-start text-left font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                {filters.dateTo ? format(filters.dateTo, "dd MMM", { locale: id }) : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={filters.dateTo}
                onSelect={(date) => onFiltersChange({ ...filters, dateTo: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Active filters display */}
      {activeFiltersCount > 0 && !showAdvanced && (
        <div className="flex flex-wrap gap-2">
          {filters.action !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Action: {filters.action}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, action: "all" })} />
            </Badge>
          )}
          {filters.entityType !== "all" && (
            <Badge variant="secondary" className="gap-1">
              Entity: {filters.entityType}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, entityType: "all" })}
              />
            </Badge>
          )}
          {filters.userId !== "all" && (
            <Badge variant="secondary" className="gap-1">
              User: {users.find((u) => u.id === filters.userId)?.name}
              <X className="h-3 w-3 cursor-pointer" onClick={() => onFiltersChange({ ...filters, userId: "all" })} />
            </Badge>
          )}
          {(filters.dateFrom || filters.dateTo) && (
            <Badge variant="secondary" className="gap-1">
              Date: {filters.dateFrom ? format(filters.dateFrom, "dd/MM") : "..."} -{" "}
              {filters.dateTo ? format(filters.dateTo, "dd/MM") : "..."}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => onFiltersChange({ ...filters, dateFrom: undefined, dateTo: undefined })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
