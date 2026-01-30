"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { 
  Heart, 
  Star, 
  Play, 
  FileText, 
  MoreVertical, 
  Check,
  Eye,
  Download,
  Trash2,
  FolderPlus,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";
import type { MediaAsset } from "@/lib/media/types";
import { ENTITY_COLORS } from "@/lib/media/types";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ============================================================================
// Types
// ============================================================================

interface MediaGridProps {
  assets: MediaAsset[];
  loading?: boolean;
  selectable?: boolean;
  selectedIds?: string[];
  onSelect?: (id: string) => void;
  onSelectAll?: () => void;
  onClearSelection?: () => void;
  onAssetClick?: (asset: MediaAsset) => void;
  onToggleFavorite?: (asset: MediaAsset) => void;
  onDelete?: (asset: MediaAsset) => void;
  onAddToCollection?: (asset: MediaAsset) => void;
  onEditTags?: (asset: MediaAsset) => void;
}

// ============================================================================
// Component
// ============================================================================

export function MediaGrid({
  assets,
  loading = false,
  selectable = false,
  selectedIds = [],
  onSelect,
  onAssetClick,
  onToggleFavorite,
  onDelete,
  onAddToCollection,
  onEditTags,
}: MediaGridProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const normalizeImageSrc = useCallback((src: string | null | undefined) => {
    if (!src) return null;
    if (src.startsWith("/") || /^https?:\/\//i.test(src)) return src;
    // Anything else (e.g. "originals/...") is not safe for next/image and would crash the page.
    return null;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent, asset: MediaAsset) => {
    if (selectable && (e.metaKey || e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      onSelect?.(asset.id);
    } else if (!selectable) {
      onAssetClick?.(asset);
    }
  }, [selectable, onSelect, onAssetClick]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-lg bg-muted animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <FileText className="w-12 h-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">No media found</h3>
        <p className="text-sm text-muted-foreground">
          Upload your first media or adjust your filters
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      <AnimatePresence mode="popLayout">
        {assets.map((asset, index) => {
          const isSelected = selectedIds.includes(asset.id);
          const isHovered = hoveredId === asset.id;
          const imageSrc = normalizeImageSrc(asset.cdn_url || asset.thumbnail_path || asset.preview_path || asset.original_path);

          return (
            <motion.div
              key={asset.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ ...spring.default, delay: index * 0.02 }}
              className="relative group"
              onMouseEnter={() => setHoveredId(asset.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Card */}
              <div
                onClick={(e) => handleClick(e, asset)}
                className={cn(
                  "aspect-square rounded-lg overflow-hidden cursor-pointer transition-all",
                  "bg-muted border border-border",
                  "hover:ring-2 hover:ring-primary hover:ring-offset-2 hover:ring-offset-background",
                  isSelected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                )}
              >
                {/* Thumbnail */}
                {asset.file_type === "image" && (
                  imageSrc ? (
                    <Image
                      src={imageSrc}
                      alt={asset.title || asset.file_name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-muted" />
                  )
                )}

                {asset.file_type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    {asset.thumbnail_path ? (
                      <Image
                        src={asset.thumbnail_path}
                        alt={asset.title || asset.file_name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-muted" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-black/50 flex items-center justify-center">
                        <Play className="w-6 h-6 text-white fill-white" />
                      </div>
                    </div>
                    {asset.duration_seconds && (
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white font-medium">
                        {formatDuration(asset.duration_seconds)}
                      </div>
                    )}
                  </div>
                )}

                {asset.file_type === "document" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4">
                    <FileText className="w-10 h-10 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground text-center truncate w-full">
                      {asset.file_name}
                    </span>
                  </div>
                )}

                {/* Selection checkbox */}
                {selectable && (
                  <div
                    className={cn(
                      "absolute top-2 left-2 w-5 h-5 rounded border-2 transition-all",
                      "flex items-center justify-center",
                      isSelected 
                        ? "bg-primary border-primary" 
                        : "bg-background/80 border-border opacity-0 group-hover:opacity-100"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect?.(asset.id);
                    }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                )}

                {/* Favorite indicator */}
                {asset.is_favorite && (
                  <div className="absolute top-2 right-2">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                  </div>
                )}

                {/* Brand asset indicator */}
                {asset.is_brand_asset && (
                  <div className="absolute top-2 right-2">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  </div>
                )}

                {/* Entity badge */}
                {asset.entity_id && (
                  <div 
                    className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
                    style={{ backgroundColor: ENTITY_COLORS[asset.entity_id] || "#666" }}
                  >
                    {asset.entity_id.toUpperCase()}
                  </div>
                )}

                {/* Hover overlay */}
                <AnimatePresence>
                  {isHovered && !selectable && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center"
                    >
                      <Button
                        size="sm"
                        variant="secondary"
                        className="gap-1.5"
                        onClick={(e) => {
                          e.stopPropagation();
                          onAssetClick?.(asset);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Actions menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "absolute top-2 right-2 h-7 w-7",
                      "opacity-0 group-hover:opacity-100 transition-opacity",
                      "bg-background/80 hover:bg-background"
                    )}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => onAssetClick?.(asset)}>
                    <Eye className="w-4 h-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleFavorite?.(asset)}>
                    <Heart className={cn("w-4 h-4 mr-2", asset.is_favorite && "fill-current")} />
                    {asset.is_favorite ? "Remove Favorite" : "Add to Favorites"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onAddToCollection?.(asset)}>
                    <FolderPlus className="w-4 h-4 mr-2" />
                    Add to Collection
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onEditTags?.(asset)}>
                    <Tags className="w-4 h-4 mr-2" />
                    Edit Tags
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a 
                      href={asset.cdn_url || undefined}
                      download={asset.file_name}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </a>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-destructive focus:text-destructive"
                    onClick={() => onDelete?.(asset)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
