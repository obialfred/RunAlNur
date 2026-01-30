'use client';

import { useEffect, useState } from "react";
import { useSyncStatus } from '@/lib/hooks/useOfflineFirst';
import { Cloud, CloudOff, RefreshCw, AlertCircle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function SyncStatusIndicator() {
  // Avoid SSR/CSR mismatches (online status + pending counts differ server vs client)
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { status, isOnline, pendingCount, sync } = useSyncStatus();

  if (!mounted) {
    // Keep layout stable without triggering hydration warnings
    return <span className="inline-block h-6 w-10" aria-hidden="true" />;
  }

  const getIcon = () => {
    if (!isOnline) {
      return <CloudOff className="h-4 w-4" />;
    }
    
    switch (status) {
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        if (pendingCount > 0) {
          return <Cloud className="h-4 w-4" />;
        }
        return <Check className="h-4 w-4" />;
    }
  };

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline - changes will sync when connected';
    }
    
    switch (status) {
      case 'syncing':
        return 'Syncing...';
      case 'error':
        return 'Sync error - tap to retry';
      default:
        if (pendingCount > 0) {
          return `${pendingCount} change${pendingCount > 1 ? 's' : ''} pending`;
        }
        return 'All changes synced';
    }
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-amber-500';
    
    switch (status) {
      case 'syncing':
        return 'text-sky-500';
      case 'error':
        return 'text-red-500';
      default:
        if (pendingCount > 0) {
          return 'text-amber-500';
        }
        return 'text-emerald-500';
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => {
            if (isOnline && status !== 'syncing') {
              sync();
            }
          }}
          className={cn(
            'flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-colors',
            'hover:bg-foreground/5',
            getStatusColor()
          )}
          disabled={!isOnline || status === 'syncing'}
        >
          {getIcon()}
          {pendingCount > 0 && (
            <span className="tabular-nums">{pendingCount}</span>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>{getStatusText()}</p>
      </TooltipContent>
    </Tooltip>
  );
}
