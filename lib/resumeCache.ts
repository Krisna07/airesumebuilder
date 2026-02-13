/**
 * Resume Cache Manager
 * Provides localStorage caching with sync queue and conflict resolution
 */

import { ResumeData } from '@/types/types';

const CACHE_PREFIX = 'resume_cache_';
const SYNC_QUEUE_KEY = 'resume_sync_queue';
// const LAST_SYNC_KEY = 'resume_last_sync_';

export interface CachedResume {
  data: ResumeData;
  timestamp: number;
  version: number;
  isDirty: boolean; // Has unsaved changes
  lastSyncedAt: number | null;
  lastSyncedHash?: string | null;
}

export interface SyncQueueItem {
  resumeId: string;
  data: ResumeData;
  timestamp: number;
  retryCount: number;
}

export class ResumeCache {
  /**
   * Compute a simple hash for ResumeData using JSON stringify
   */
  static computeHash(data: ResumeData): string {
    try {
      return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
    } catch {
      // Fallback to plain stringify
      return JSON.stringify(data);
    }
  }
  /**
   * Get resume from cache
   */
  static get(resumeId: string): CachedResume | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const key = `${CACHE_PREFIX}${resumeId}`;
      const cached = localStorage.getItem(key);
      if (!cached) return null;
      
      return JSON.parse(cached) as CachedResume;
    } catch (error) {
      console.error('Cache read error:', error);
      return null;
    }
  }

  /**
   * Set resume in cache
   */
  static set(resumeId: string, data: ResumeData, isDirty = true): void {
    if (typeof window === 'undefined') return;

    try {
      const existing = this.get(resumeId);
      const cached: CachedResume = {
        data,
        timestamp: Date.now(),
        version: (existing?.version ?? 0) + 1,
        isDirty,
        lastSyncedAt: isDirty ? existing?.lastSyncedAt ?? null : Date.now(),
        lastSyncedHash: existing?.lastSyncedHash ?? null,
      };

      const key = `${CACHE_PREFIX}${resumeId}`;
      localStorage.setItem(key, JSON.stringify(cached));

      // Add to sync queue if dirty
      if (isDirty) {
        const currentHash = this.computeHash(data);
        if (existing?.lastSyncedHash && existing.lastSyncedHash === currentHash) {
          // No actual change vs last synced; mark clean and skip queue
          cached.isDirty = false;
          cached.lastSyncedAt = existing.lastSyncedAt ?? Date.now();
        } else {
          this.addToSyncQueue(resumeId, data);
        }
      }
    } catch (error) {
      console.error('Cache write error:', error);
      // Try to free space by removing oldest cached resume
      this.clearOldestCache();
    }
  }

  /**
   * Mark as synced
   */
  static markSynced(resumeId: string): void {
    const cached = this.get(resumeId);
    if (!cached) return;

    cached.isDirty = false;
    cached.lastSyncedAt = Date.now();
    cached.lastSyncedHash = this.computeHash(cached.data);
    
    const key = `${CACHE_PREFIX}${resumeId}`;
    localStorage.setItem(key, JSON.stringify(cached));
    
    // Remove from sync queue
    this.removeFromSyncQueue(resumeId);
  }

  /**
   * Check if resume has unsaved changes
   */
  static isDirty(resumeId: string): boolean {
    const cached = this.get(resumeId);
    return cached?.isDirty ?? false;
  }

  /**
   * Get last synced hash
   */
  static getLastSyncedHash(resumeId: string): string | null {
    const cached = this.get(resumeId);
    return cached?.lastSyncedHash ?? null;
  }

  /**
   * Get current cached hash
   */
  static getCurrentHash(resumeId: string): string | null {
    const cached = this.get(resumeId);
    return cached ? this.computeHash(cached.data) : null;
  }

  /**
   * Get time since last sync
   */
  static getTimeSinceSync(resumeId: string): number | null {
    const cached = this.get(resumeId);
    if (!cached?.lastSyncedAt) return null;
    return Date.now() - cached.lastSyncedAt;
  }

  /**
   * Add to sync queue
   */
  private static addToSyncQueue(resumeId: string, data: ResumeData): void {
    if (typeof window === 'undefined') return;

    try {
      const queue = this.getSyncQueue();
      const existingIndex = queue.findIndex(item => item.resumeId === resumeId);

      const item: SyncQueueItem = {
        resumeId,
        data,
        timestamp: Date.now(),
        retryCount: 0,
      };

      if (existingIndex >= 0) {
        queue[existingIndex] = item;
      } else {
        queue.push(item);
      }

      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Sync queue error:', error);
    }
  }

  /**
   * Get sync queue
   */
  static getSyncQueue(): SyncQueueItem[] {
    if (typeof window === 'undefined') return [];

    try {
      const queue = localStorage.getItem(SYNC_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch {
      return [];
    }
  }

  /**
   * Remove from sync queue
   */
  private static removeFromSyncQueue(resumeId: string): void {
    if (typeof window === 'undefined') return;

    try {
      const queue = this.getSyncQueue();
      const filtered = queue.filter(item => item.resumeId !== resumeId);
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Sync queue removal error:', error);
    }
  }

  /**
   * Clear cache for specific resume
   */
  static clear(resumeId: string): void {
    if (typeof window === 'undefined') return;

    const key = `${CACHE_PREFIX}${resumeId}`;
    localStorage.removeItem(key);
    this.removeFromSyncQueue(resumeId);
  }

  /**
   * Clear oldest cache entry (for space management)
   */
  private static clearOldestCache(): void {
    if (typeof window === 'undefined') return;

    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
      if (keys.length === 0) return;

      let oldestKey = keys[0];
      let oldestTime = Infinity;

      for (const key of keys) {
        try {
          const cached = JSON.parse(localStorage.getItem(key) ?? '{}');
          if (cached.timestamp < oldestTime) {
            oldestTime = cached.timestamp;
            oldestKey = key;
          }
        } catch {
          // Invalid entry, remove it
          localStorage.removeItem(key);
        }
      }

      localStorage.removeItem(oldestKey);
      console.warn('Cleared oldest cache:', oldestKey);
    } catch (error) {
      console.error('Cache cleanup error:', error);
    }
  }

  /**
   * Get all cached resume IDs
   */
  static getAllCachedIds(): string[] {
    if (typeof window === 'undefined') return [];

    try {
      const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_PREFIX));
      return keys.map(k => k.replace(CACHE_PREFIX, ''));
    } catch {
      return [];
    }
  }

  /**
   * Conflict resolution: Compare server vs cache version
   */
  static detectConflict(resumeId: string, serverData: ResumeData, serverTimestamp: number): boolean {
    const cached = this.get(resumeId);
    if (!cached) return false;

    // Conflict if cache is newer and dirty
    return cached.isDirty && cached.timestamp > serverTimestamp;
  }

  /**
   * Get cache stats for debugging
   */
  static getStats(): {
    totalCached: number;
    dirtyCount: number;
    queueSize: number;
    cacheSize: number;
  } {
    const ids = this.getAllCachedIds();
    const dirtyCount = ids.filter(id => this.isDirty(id)).length;
    const queue = this.getSyncQueue();

    // Approximate cache size
    let cacheSize = 0;
    ids.forEach(id => {
      const key = `${CACHE_PREFIX}${id}`;
      const item = localStorage.getItem(key);
      if (item) cacheSize += item.length;
    });

    return {
      totalCached: ids.length,
      dirtyCount,
      queueSize: queue.length,
      cacheSize,
    };
  }
}
