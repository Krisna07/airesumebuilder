/**
 * Sync Status Indicator Component
 * Shows visual feedback for sync status
 */

import React from 'react';
import { Cloud, CloudOff, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { SyncStatus } from '@/hooks/useResumeSync';

interface SyncIndicatorProps {
  status: SyncStatus;
  lastSyncTime: number | null;
  className?: string;
}

export function SyncIndicator({ status, lastSyncTime, className = '' }: SyncIndicatorProps) {
  const getTimeAgo = (timestamp: number | null): string => {
    if (!timestamp) return '';
    
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const renderIndicator = () => {
    switch (status) {
      case 'syncing':
        return (
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs font-medium">Saving...</span>
          </div>
        );
      
      case 'synced':
        return (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-xs font-medium">
              Saved {getTimeAgo(lastSyncTime)}
            </span>
          </div>
        );
      
      case 'error':
        return (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-xs font-medium">Failed to save</span>
          </div>
        );
      
      case 'offline':
        return (
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <CloudOff className="w-4 h-4" />
            <span className="text-xs font-medium">Offline</span>
          </div>
        );
      
      case 'idle':
      default:
        if (lastSyncTime) {
          return (
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <Cloud className="w-4 h-4" />
            </div>
          );
        }
        return null;
    }
  };

  return (
    <div className={`transition-all duration-200 ${className}`}>
      {renderIndicator()}
    </div>
  );
}
