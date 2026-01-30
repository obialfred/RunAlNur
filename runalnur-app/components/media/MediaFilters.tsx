"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  SlidersHorizontal, 
  X,
  Image,
  Film,
  FileText,
  Heart,
  Star,
  Calendar,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ARMS } from "@/lib/constants";
import type { MediaFilters as MediaFiltersType } from "@/lib/media/types";

// ============================================================================
// Types
// ============================================================================

interface MediaFiltersProps {
  filters: MediaFiltersType;
  onChange: (filters: MediaFiltersType) => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

export function MediaFilters({ filters, onChange, className }: MediaFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [searchValue, setSearchValue] = useState(filters.search || "");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onChange({ ...filters, search: searchValue });
  };

  const handleClearSearch = () => {
    setSearchValue("");
    onChange({ ...filters, search: undefined });
  };

  const toggleFilter = (key: keyof MediaFiltersType, value: unknown) => {
    const currentValue = filters[key];
    if (currentValue === value) {
      // Remove filter
      const newFilters = { ...filters };
      delete newFilters[key];
      onChange(newFilters);
    } else {
      onChange({ ...filters, [key]: value });
    }
  };

  const hasActiveFilters = Boolean(
    filters.entity_id || 
    filters.file_type || 
    filters.is_favorite || 
    filters.is_brand_asset ||
    filters.date_from ||
    filters.date_to ||
    (filters.tags && filters.tags.length > 0)
  );

  const clearAllFilters = () => {
    setSearchValue("");
    onChange({});
  };

  return (
    <div className={cn("space-y-3", className)}>
      {/* Search and toggle row */}
      <div className="flex items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            placeholder="Search media..."
            className="pl-9 pr-9 h-10"
          />
          {searchValue && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <Button
          variant={showAdvanced || hasActiveFilters ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="gap-2 shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasActiveFilters && (
            <span className="w-2 h-2 rounded-full bg-primary" />
          )}
        </Button>
      </div>

      {/* Quick filters - always visible */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {/* File type filters */}
        <FilterChip
          icon={<Image className="w-3 h-3" />}
          label="Images"
          active={filters.file_type === "image"}
          onClick={() => toggleFilter("file_type", "image")}
        />
        <FilterChip
          icon={<Film className="w-3 h-3" />}
          label="Videos"
          active={filters.file_type === "video"}
          onClick={() => toggleFilter("file_type", "video")}
        />
        <FilterChip
          icon={<FileText className="w-3 h-3" />}
          label="Documents"
          active={filters.file_type === "document"}
          onClick={() => toggleFilter("file_type", "document")}
        />

        <div className="w-px h-5 bg-border mx-1" />

        {/* Special filters */}
        <FilterChip
          icon={<Heart className="w-3 h-3" />}
          label="Favorites"
          active={filters.is_favorite === true}
          onClick={() => toggleFilter("is_favorite", true)}
        />
        <FilterChip
          icon={<Star className="w-3 h-3" />}
          label="Brand Assets"
          active={filters.is_brand_asset === true}
          onClick={() => toggleFilter("is_brand_asset", true)}
        />
      </div>

      {/* Advanced filters */}
      <AnimatePresence>
        {showAdvanced && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={spring.default}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-3 border-t border-border">
              {/* Entity filter */}
              <div>
                <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                  Entity
                </label>
                <div className="flex flex-wrap gap-2">
                  {ARMS.map((arm) => (
                    <FilterChip
                      key={arm.id}
                      icon={<Building2 className="w-3 h-3" />}
                      label={arm.name}
                      active={filters.entity_id === arm.id}
                      onClick={() => toggleFilter("entity_id", arm.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                    From Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={filters.date_from || ""}
                      onChange={(e) => onChange({ ...filters, date_from: e.target.value || undefined })}
                      className="pl-9"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-medium tracking-wider uppercase text-muted-foreground block mb-2">
                    To Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="date"
                      value={filters.date_to || ""}
                      onChange={(e) => onChange({ ...filters, date_to: e.target.value || undefined })}
                      className="pl-9"
                    />
                  </div>
                </div>
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="text-muted-foreground"
                >
                  <X className="w-4 h-4 mr-2" />
                  Clear all filters
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Filter Chip
// ============================================================================

interface FilterChipProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

function FilterChip({ icon, label, active, onClick }: FilterChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0",
        active
          ? "bg-foreground text-background"
          : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
