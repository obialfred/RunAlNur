"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  UploadCloud, 
  FolderPlus, 
  Grid3X3, 
  LayoutList,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";
import { FadeIn } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { MediaGrid } from "@/components/media/MediaGrid";
import { MediaUploader } from "@/components/media/MediaUploader";
import { MediaFilters } from "@/components/media/MediaFilters";
import { MediaViewer } from "@/components/media/MediaViewer";
import { useMedia, useMediaMutations } from "@/lib/hooks/useMedia";
import type { MediaFilters as MediaFiltersType, MediaAsset } from "@/lib/media/types";
import { spring } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MediaLibraryPage() {
  // State
  const [filters, setFilters] = useState<MediaFiltersType>({});
  const [showUploader, setShowUploader] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  // Data
  const { assets, total, loading, error, refresh } = useMedia(filters);
  const { toggleFavorite, deleteAsset, loading: mutating } = useMediaMutations();

  // Handlers
  const handleFilterChange = useCallback((newFilters: MediaFiltersType) => {
    setFilters(newFilters);
    setSelectedIds([]); // Clear selection on filter change
  }, []);

  const handleAssetClick = useCallback((asset: MediaAsset) => {
    setSelectedAsset(asset);
  }, []);

  const handleViewerClose = useCallback(() => {
    setSelectedAsset(null);
  }, []);

  const handleViewerPrevious = useCallback(() => {
    if (!selectedAsset) return;
    const currentIndex = assets.findIndex(a => a.id === selectedAsset.id);
    if (currentIndex > 0) {
      setSelectedAsset(assets[currentIndex - 1]);
    }
  }, [selectedAsset, assets]);

  const handleViewerNext = useCallback(() => {
    if (!selectedAsset) return;
    const currentIndex = assets.findIndex(a => a.id === selectedAsset.id);
    if (currentIndex < assets.length - 1) {
      setSelectedAsset(assets[currentIndex + 1]);
    }
  }, [selectedAsset, assets]);

  const handleToggleFavorite = useCallback(async (asset: MediaAsset) => {
    const updated = await toggleFavorite(asset);
    if (updated) {
      refresh();
      toast.success(updated.is_favorite ? "Added to favorites" : "Removed from favorites");
    }
  }, [toggleFavorite, refresh]);

  const handleDelete = useCallback(async (asset: MediaAsset) => {
    if (!confirm(`Delete "${asset.file_name}"? This action cannot be undone.`)) return;
    
    const success = await deleteAsset(asset.id);
    if (success) {
      refresh();
      toast.success("Media deleted");
    }
  }, [deleteAsset, refresh]);

  const handleSelect = useCallback((id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  }, []);

  const handleUploadComplete = useCallback(() => {
    setShowUploader(false);
    refresh();
    toast.success("Upload complete");
  }, [refresh]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <FadeIn>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
              Media Library
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {loading ? "Loading..." : `${total} assets`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center border border-border rounded-md p-0.5">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode("list")}
              >
                <LayoutList className="w-4 h-4" />
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
              <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* TODO: Create collection modal */}}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Collection
            </Button>

            <Button
              size="sm"
              onClick={() => setShowUploader(!showUploader)}
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Uploader */}
      <motion.div
        initial={false}
        animate={{ 
          height: showUploader ? "auto" : 0, 
          opacity: showUploader ? 1 : 0 
        }}
        transition={spring.default}
        className="overflow-hidden"
      >
        <FadeIn className="pb-4">
          <MediaUploader
            onUploadComplete={handleUploadComplete}
            options={{ auto_tag: true }}
          />
        </FadeIn>
      </motion.div>

      {/* Filters */}
      <FadeIn delay={0.1}>
        <MediaFilters 
          filters={filters} 
          onChange={handleFilterChange} 
        />
      </FadeIn>

      {/* Selection bar */}
      {selectedIds.length > 0 && (
        <FadeIn>
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm">
              {selectedIds.length} selected
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedIds([])}>
                Clear selection
              </Button>
              <Button variant="destructive" size="sm">
                Delete selected
              </Button>
            </div>
          </div>
        </FadeIn>
      )}

      {/* Error state */}
      {error && (
        <FadeIn>
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </FadeIn>
      )}

      {/* Grid */}
      <FadeIn delay={0.2}>
        <MediaGrid
          assets={assets}
          loading={loading}
          selectable={selectedIds.length > 0}
          selectedIds={selectedIds}
          onSelect={handleSelect}
          onAssetClick={handleAssetClick}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDelete}
          onAddToCollection={() => {/* TODO */}}
          onEditTags={() => {/* TODO */}}
        />
      </FadeIn>

      {/* Load more */}
      {assets.length > 0 && assets.length < total && (
        <FadeIn className="flex justify-center">
          <Button variant="outline" size="sm">
            Load more
          </Button>
        </FadeIn>
      )}

      {/* Media Viewer Modal */}
      {selectedAsset && (
        <MediaViewer
          asset={selectedAsset}
          assets={assets}
          onClose={handleViewerClose}
          onPrevious={handleViewerPrevious}
          onNext={handleViewerNext}
          onToggleFavorite={handleToggleFavorite}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
