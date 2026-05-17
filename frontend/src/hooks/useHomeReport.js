import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

export function useHomeReport(artistId) {
  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await api.get(`/api/home/${artistId}`);
    if (error) setError(error);
    else setReport(data);
    setLoading(false);
  }, [artistId]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await api.post(`/api/home/${artistId}/refresh`);
    if (error) setError(error);
    else setReport(data);
    setLoading(false);
  }, [artistId]);

  useEffect(() => { load(); }, [load]);

  return { report, loading, error, refresh, reload: load };
}
