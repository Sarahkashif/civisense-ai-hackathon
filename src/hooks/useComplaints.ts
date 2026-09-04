import { useState, useEffect, useCallback } from 'react';
import type { Complaint } from '../types';
import { loadComplaints } from '../services/complaintService';

/**
 * Hook to access and refresh complaint data from Supabase (or localStorage fallback).
 * Fetches data asynchronously on mount and provides a refresh function.
 */
export function useComplaints() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await loadComplaints();
      setComplaints(data);
    } catch (e) {
      console.error('Failed to load complaints:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { complaints, refresh, loading };
}
