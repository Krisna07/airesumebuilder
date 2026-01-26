/**
 * Resume Background Sync Hook
 * Provides debounced, non-blocking sync with retry logic
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { ResumeData } from '@/types/types';
import { ResumeCache } from '@/lib/resumeCache';
import { ResumeService } from '@/services/resumeServices';
import { LocalResumeService } from '@/services/localResumeService';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface UseSyncOptions {
  resumeId: string;
  userId?: string;
  template: string;
  debounceMs?: number;
  onSyncError?: (error: Error) => void;
  onSyncSuccess?: () => void;
}

export function useResumeSync({
  resumeId,
  userId,
  template,
  debounceMs = 3000,
  onSyncError,
  onSyncSuccess,
}: UseSyncOptions) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isSyncingRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  // Ensure initial queued sync is processed only once per resumeId
  const initialQueueProcessedRef = useRef(false);
  // Stabilize performSync reference for effects
  const performSyncRef = useRef<(data: ResumeData) => Promise<boolean>>(async () => false);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('idle');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Perform sync to server
   */
  const performSync = useCallback(async (data: ResumeData): Promise<boolean> => {
    // Skip if data hasn't changed since last sync
    const incomingHash = ResumeCache.computeHash(data);
    const lastSyncedHash = ResumeCache.getLastSyncedHash(resumeId);
    if (lastSyncedHash && lastSyncedHash === incomingHash) {
      // Already synced with identical content
      setSyncStatus('synced');
      setTimeout(() => setSyncStatus('idle'), 1000);
      return true;
    }
    if (!isOnline) {
      setSyncStatus('offline');
      return false;
    }

    if (isSyncingRef.current) {
      return false;
    }

    isSyncingRef.current = true;
    setSyncStatus('syncing');

    try {
      if (userId) {
        // Logged-in user: sync to server
        await ResumeService.save(userId, resumeId, template, data);
      } else {
        // Guest user: save to localStorage
        await LocalResumeService.update(resumeId, data);
      }

      // Mark as synced in cache
      // Update cache with latest data and synced hash
      ResumeCache.set(resumeId, data, false);
      ResumeCache.markSynced(resumeId);
      
      setSyncStatus('synced');
      setLastSyncTime(Date.now());
      retryCountRef.current = 0;
      
      onSyncSuccess?.();
      
      // Reset to idle after 2 seconds
      setTimeout(() => setSyncStatus('idle'), 2000);
      
      return true;
    } catch (error) {
      console.error('Sync error:', error);
      
      retryCountRef.current++;
      
      if (retryCountRef.current < maxRetries) {
        // Exponential backoff
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000);
        console.log(`Retrying sync in ${delay}ms (attempt ${retryCountRef.current}/${maxRetries})`);
        
        setTimeout(() => {
          performSync(data);
        }, delay);
      } else {
        setSyncStatus('error');
        onSyncError?.(error instanceof Error ? error : new Error('Sync failed'));
        retryCountRef.current = 0;
      }
      
      return false;
    } finally {
      isSyncingRef.current = false;
    }
  }, [isOnline, userId, resumeId, template, onSyncSuccess, onSyncError]);

  // Keep latest performSync in ref to avoid effect re-runs from dependency changes
  useEffect(() => {
    performSyncRef.current = performSync;
  }, [performSync]);

  /**
   * Queue sync with debounce
   */
  const queueSync = useCallback((data: ResumeData) => {
    // Compute hashes to avoid redundant updates
    const newHash = ResumeCache.computeHash(data);
    const currentHash = ResumeCache.getCurrentHash(resumeId);
    // const lastSyncedHash = ResumeCache.getLastSyncedHash(resumeId);

    // If identical to current cached data, skip any work
    if (currentHash && currentHash === newHash) {
      return;
    }

    // Save to cache (optimistic) only if changed vs cached
    ResumeCache.set(resumeId, data, true);

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Queue new sync
    syncTimeoutRef.current = setTimeout(() => {
      // Skip if identical to last synced hash
      const latestLastHash = ResumeCache.getLastSyncedHash(resumeId);
      const latestIncomingHash = ResumeCache.computeHash(data);
      if (latestLastHash && latestLastHash === latestIncomingHash) {
        return;
      }
      performSync(data);
    }, debounceMs);
  }, [resumeId, debounceMs, performSync]);

  /**
   * Force immediate sync
   */
  const syncNow = useCallback(async (data: ResumeData): Promise<boolean> => {
    // Clear debounce timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

    return performSync(data);
  }, [performSync]);

  /**
   * Cancel pending sync
   */
  const cancelSync = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    setSyncStatus('idle');
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Process sync queue on mount (recover unsaved changes)
   */
  // Process sync queue once when online and for current resumeId
  useEffect(() => {
    if (!isOnline) return;
    if (initialQueueProcessedRef.current) return;

    initialQueueProcessedRef.current = true;
    const queue = ResumeCache.getSyncQueue();
    const item = queue.find(q => q.resumeId === resumeId);
    if (item) {
      // Avoid noisy logs in production; rely on indicator UI
      // Process using latest performSync reference
      void performSyncRef.current(item.data);
    }
  }, [resumeId, isOnline]);

  // Reset the initial queue processed flag when resumeId changes
  useEffect(() => {
    initialQueueProcessedRef.current = false;
  }, [resumeId]);

  return {
    syncStatus,
    lastSyncTime,
    isOnline,
    queueSync,
    syncNow,
    cancelSync,
  };
}
