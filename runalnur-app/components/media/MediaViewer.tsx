"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence, PanInfo, useAnimation } from "framer-motion";
import Image from "next/image";
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Heart, 
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Info,
  Copy,
  ExternalLink,
  Share2,
  MoreVertical,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { spring } from "@/lib/motion/tokens";
import type { MediaAsset } from "@/lib/media/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { format } from "date-fns";

interface MediaViewerProps {
  asset: MediaAsset | null;
  assets?: MediaAsset[];
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
  onToggleFavorite?: (asset: MediaAsset) => void;
  onDelete?: (asset: MediaAsset) => void;
}

// Detect if touch device
const isTouchDevice = () => typeof window !== "undefined" && ("ontouchstart" in window || navigator.maxTouchPoints > 0);

export function MediaViewer({
  asset,
  assets = [],
  onClose,
  onPrevious,
  onNext,
  onToggleFavorite,
  onDelete,
}: MediaViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [showInfo, setShowInfo] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [imageLoaded, setImageLoaded] = useState(false);
  const controls = useAnimation();

  // Reset state when asset changes
  useEffect(() => {
    setZoom(1);
    setRotation(0);
    setImageLoaded(false);
    setShowInfo(false);
  }, [asset?.id]);

  // Toggle controls on tap (mobile) - user controls visibility
  const toggleControls = useCallback(() => {
    setShowControls(prev => !prev);
  }, []);

  // Always show controls initially
  useEffect(() => {
    setShowControls(true);
  }, [asset?.id]);

  // Keyboard navigation (desktop)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!asset) return;
      
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          onPrevious?.();
          break;
        case "ArrowRight":
          onNext?.();
          break;
        case "i":
          setShowInfo(prev => !prev);
          break;
        case "+":
        case "=":
          setZoom(prev => Math.min(prev + 0.25, 3));
          break;
        case "-":
          setZoom(prev => Math.max(prev - 0.25, 0.5));
          break;
        case "r":
          setRotation(prev => (prev + 90) % 360);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [asset, onClose, onPrevious, onNext]);

  // Swipe gesture handling for mobile
  const handleDragEnd = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    const velocity = 0.5;
    
    if (info.offset.x > threshold || info.velocity.x > velocity) {
      // Swipe right -> previous
      onPrevious?.();
    } else if (info.offset.x < -threshold || info.velocity.x < -velocity) {
      // Swipe left -> next
      onNext?.();
    } else if (info.offset.y > threshold * 2 || info.velocity.y > velocity) {
      // Swipe down -> close
      onClose();
    }
    
    // Reset position
    controls.start({ x: 0, y: 0 });
  }, [onPrevious, onNext, onClose, controls]);

  const handleDownload = useCallback(() => {
    if (!asset?.cdn_url) return;
    
    const link = document.createElement("a");
    link.href = asset.cdn_url;
    link.download = asset.file_name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started");
  }, [asset]);

  const handleShare = useCallback(async () => {
    if (!asset?.cdn_url) return;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: asset.title || asset.file_name,
          url: asset.cdn_url,
        });
      } catch (err) {
        // User cancelled or error
        if ((err as Error).name !== "AbortError") {
          handleCopyUrl();
        }
      }
    } else {
      handleCopyUrl();
    }
  }, [asset]);

  const handleCopyUrl = useCallback(() => {
    if (!asset?.cdn_url) return;
    navigator.clipboard.writeText(asset.cdn_url);
    toast.success("URL copied to clipboard");
  }, [asset]);

  const handleBackgroundTap = useCallback((e: React.MouseEvent) => {
    // Only toggle if clicking the background, not controls
    if (e.target === e.currentTarget) {
      toggleControls();
    }
  }, [toggleControls]);

  const currentIndex = asset ? assets.findIndex(a => a.id === asset.id) : -1;
  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex < assets.length - 1;

  const imageSrc = asset?.cdn_url || asset?.preview_path || asset?.original_path;

  if (!asset) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black flex flex-col"
        onClick={handleBackgroundTap}
      >
        {/* Header - Mobile optimized */}
        <AnimatePresence>
          {showControls && (
            <motion.header
              initial={{ y: -60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -60, opacity: 0 }}
              transition={spring.snappy}
              className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 via-black/40 to-transparent"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 sm:p-4 safe-area-top">
                {/* Left: Close + Title */}
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 h-10 w-10 sm:h-9 sm:w-9 shrink-0"
                    onClick={onClose}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                  <div className="min-w-0">
                    <h2 className="font-medium text-white truncate text-sm sm:text-base">
                      {asset.title || asset.file_name}
                    </h2>
                    {assets.length > 1 && (
                      <p className="text-xs text-white/60">
                        {currentIndex + 1} of {assets.length}
                      </p>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Zoom controls - visible on all devices */}
                  <div className="flex items-center gap-0.5 sm:gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 h-10 w-10 sm:h-9 sm:w-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoom(prev => Math.max(prev - 0.5, 0.5));
                      }}
                    >
                      <ZoomOut className="w-5 h-5 sm:w-4 sm:h-4" />
                    </Button>
                    <span className="text-xs text-white/60 w-10 text-center hidden sm:inline">
                      {Math.round(zoom * 100)}%
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 h-10 w-10 sm:h-9 sm:w-9"
                      onClick={(e) => {
                        e.stopPropagation();
                        setZoom(prev => Math.min(prev + 0.5, 3));
                      }}
                    >
                      <ZoomIn className="w-5 h-5 sm:w-4 sm:h-4" />
                    </Button>
                    <div className="w-px h-6 bg-white/20 mx-0.5 sm:mx-1 hidden sm:block" />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 h-10 w-10 sm:h-9 sm:w-9 hidden sm:flex"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRotation(prev => (prev + 90) % 360);
                      }}
                    >
                      <RotateCw className="w-4 h-4" />
                    </Button>
                    <div className="w-px h-6 bg-white/20 mx-0.5 sm:mx-1" />
                  </div>

                  {/* Common actions - larger on mobile */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "text-white hover:bg-white/10 h-10 w-10 sm:h-9 sm:w-9",
                      asset.is_favorite && "text-rose-500"
                    )}
                    onClick={() => onToggleFavorite?.(asset)}
                  >
                    <Heart className={cn("w-5 h-5 sm:w-4 sm:h-4", asset.is_favorite && "fill-current")} />
                  </Button>

                  {/* Share button (uses native share on mobile) */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10 h-10 w-10 sm:h-9 sm:w-9"
                    onClick={handleShare}
                  >
                    <Share2 className="w-5 h-5 sm:w-4 sm:h-4" />
                  </Button>

                  {/* Info toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "text-white hover:bg-white/10 h-10 w-10 sm:h-9 sm:w-9",
                      showInfo && "bg-white/10"
                    )}
                    onClick={() => setShowInfo(prev => !prev)}
                  >
                    <Info className="w-5 h-5 sm:w-4 sm:h-4" />
                  </Button>

                  {/* More actions dropdown for mobile */}
                  <div className="sm:hidden">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 h-10 w-10"
                      onClick={handleDownload}
                    >
                      <Download className="w-5 h-5" />
                    </Button>
                  </div>

                  {/* Desktop additional actions */}
                  <div className="hidden sm:flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 h-9 w-9"
                      onClick={handleCopyUrl}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-white hover:bg-white/10 h-9 w-9"
                      onClick={handleDownload}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white hover:bg-red-500/20 hover:text-red-400 h-9 w-9"
                        onClick={() => onDelete(asset)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Main content - swipeable on mobile */}
        <div className="flex-1 flex relative overflow-hidden">
          {/* Navigation arrows - hidden on mobile, use swipe instead */}
          {hasPrevious && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full text-white bg-black/50 hover:bg-black/70"
              onClick={(e) => {
                e.stopPropagation();
                onPrevious?.();
              }}
            >
              <ChevronLeft className="w-8 h-8" />
            </Button>
          )}

          {hasNext && (
            <Button
              variant="ghost"
              size="icon"
              className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full text-white bg-black/50 hover:bg-black/70"
              onClick={(e) => {
                e.stopPropagation();
                onNext?.();
              }}
            >
              <ChevronRight className="w-8 h-8" />
            </Button>
          )}

          {/* Mobile swipe indicators */}
          <AnimatePresence>
            {showControls && assets.length > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="sm:hidden absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5"
              >
                {assets.map((a, i) => (
                  <div
                    key={a.id}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      i === currentIndex ? "bg-white w-4" : "bg-white/40"
                    )}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Image container with swipe gestures */}
          <motion.div 
            className="flex-1 flex items-center justify-center p-4 sm:p-8"
            drag={assets.length > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            animate={controls}
            onClick={toggleControls}
          >
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ 
                opacity: imageLoaded ? 1 : 0, 
                scale: zoom,
                rotate: rotation,
              }}
              transition={spring.default}
              className="relative max-w-full max-h-full select-none"
              style={{ transformOrigin: "center center" }}
            >
              {imageSrc && (
                <Image
                  src={imageSrc}
                  alt={asset.title || asset.file_name}
                  width={asset.width || 1200}
                  height={asset.height || 800}
                  className="max-h-[calc(100vh-120px)] sm:max-h-[calc(100vh-160px)] w-auto h-auto object-contain rounded-lg pointer-events-none"
                  onLoad={() => setImageLoaded(true)}
                  priority
                  unoptimized
                  draggable={false}
                />
              )}
            </motion.div>

            {/* Loading spinner */}
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </motion.div>

          {/* Info panel - slides up from bottom on mobile, side panel on desktop */}
          <AnimatePresence>
            {showInfo && (
              <>
                {/* Mobile: bottom sheet */}
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={spring.snappy}
                  className="sm:hidden absolute bottom-0 left-0 right-0 z-20 bg-black/95 rounded-t-2xl max-h-[60vh] overflow-y-auto safe-area-bottom"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4">
                    {/* Drag handle */}
                    <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-4" />
                    
                    <h3 className="font-semibold text-white mb-4">Details</h3>
                    <InfoContent asset={asset} onCopyUrl={handleCopyUrl} />
                    
                    {/* Mobile action buttons */}
                    <div className="flex gap-2 mt-6 pt-4 border-t border-white/10">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 bg-white/5 border-white/20 text-white hover:bg-white/10"
                        onClick={handleDownload}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                      {onDelete && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                          onClick={() => onDelete(asset)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Desktop: side panel */}
                <motion.aside
                  initial={{ x: 320, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: 320, opacity: 0 }}
                  transition={spring.snappy}
                  className="hidden sm:block w-80 bg-black/80 border-l border-white/10 p-4 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="font-semibold text-white mb-4">Details</h3>
                  <InfoContent asset={asset} onCopyUrl={handleCopyUrl} />
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Footer - keyboard hints (desktop only) */}
        <AnimatePresence>
          {showControls && (
            <motion.footer
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ ...spring.snappy, delay: 0.1 }}
              className="hidden sm:block absolute bottom-0 left-0 right-0 p-4 text-center text-white/40 text-xs bg-gradient-to-t from-black/60 to-transparent"
            >
              ← → Navigate • ESC Close • I Info • + - Zoom • R Rotate
            </motion.footer>
          )}
        </AnimatePresence>

        {/* Mobile: tap hint when controls hidden */}
        <AnimatePresence>
          {!showControls && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="sm:hidden absolute bottom-8 left-0 right-0 text-center"
              onClick={(e) => {
                e.stopPropagation();
                setShowControls(true);
              }}
            >
              <span className="text-white/60 text-xs bg-black/50 px-4 py-2 rounded-full">
                Tap to show controls
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile: floating close button always visible */}
        <AnimatePresence>
          {!showControls && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="sm:hidden absolute top-4 right-4 z-30 safe-area-top"
            >
              <Button
                variant="ghost"
                size="icon"
                className="text-white bg-black/50 hover:bg-black/70 h-12 w-12 rounded-full"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              >
                <X className="w-6 h-6" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile swipe hint - shown when controls visible */}
        <AnimatePresence>
          {showControls && assets.length > 1 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.3 }}
              className="sm:hidden absolute bottom-6 left-0 right-0 text-center text-white/50 text-xs pointer-events-none"
            >
              Swipe to navigate • Tap image to hide controls
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}

// Extracted info content for reuse
function InfoContent({ asset, onCopyUrl }: { asset: MediaAsset; onCopyUrl: () => void }) {
  return (
    <div className="space-y-4 text-sm">
      <InfoRow label="File name" value={asset.file_name} />
      <InfoRow label="Type" value={asset.mime_type} />
      <InfoRow 
        label="Size" 
        value={asset.file_size ? formatFileSize(asset.file_size) : "Unknown"} 
      />
      {asset.width && asset.height && (
        <InfoRow 
          label="Dimensions" 
          value={`${asset.width} × ${asset.height}`} 
        />
      )}
      <InfoRow 
        label="Uploaded" 
        value={asset.created_at ? format(new Date(asset.created_at), "PPp") : "Unknown"} 
      />
      
      {(asset.ai_tags?.length > 0 || asset.manual_tags?.length > 0) && (
        <div>
          <span className="text-white/60 block mb-2">Tags</span>
          <div className="flex flex-wrap gap-1.5">
            {[...(asset.ai_tags || []), ...(asset.manual_tags || [])].map(tag => (
              <span 
                key={tag}
                className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/80"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {asset.description && (
        <div>
          <span className="text-white/60 block mb-1">Description</span>
          <p className="text-white/80">{asset.description}</p>
        </div>
      )}

      {asset.cdn_url && (
        <div>
          <span className="text-white/60 block mb-2">URL</span>
          <div className="flex gap-2">
            <button 
              onClick={onCopyUrl}
              className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              Copy URL
            </button>
            <a 
              href={asset.cdn_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-xs flex items-center gap-1"
            >
              <ExternalLink className="w-3 h-3" />
              Open
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-white/60 block text-xs uppercase tracking-wider mb-0.5">{label}</span>
      <span className="text-white/90 break-all">{value}</span>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}
