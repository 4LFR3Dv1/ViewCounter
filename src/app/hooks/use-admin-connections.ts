import { useEffect, useState } from "react";
import { fetchAdminConnections, fetchAdminSyncJobs } from "../services/dashboard-api";
import type { AdminConnectionsOverview, AdminSyncJobItem } from "../types/admin";

export function useAdminConnections() {
  const [data, setData] = useState<AdminConnectionsOverview | null>(null);
  const [syncJobs, setSyncJobs] = useState<AdminSyncJobItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setIsLoading(true);

    try {
      const [nextData, nextJobs] = await Promise.all([fetchAdminConnections(), fetchAdminSyncJobs()]);
      setData(nextData);
      setSyncJobs(nextJobs);
      setError(null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Falha ao carregar conexoes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  return {
    data,
    syncJobs,
    isLoading,
    error,
    refresh,
  };
}
