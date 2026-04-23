import { useEffect, useMemo, useState } from "react";
import { createDashboardStream, fetchDashboard } from "../services/dashboard-api";
import type { DashboardPayload } from "../types/dashboard";

interface UseDashboardState {
  data: DashboardPayload | null;
  isLoading: boolean;
  error: string | null;
}

export function useDashboard() {
  const [state, setState] = useState<UseDashboardState>({
    data: null,
    isLoading: true,
    error: null,
  });
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    let isMounted = true;
    let stream: EventSource | null = null;

    const refreshDashboard = async () => {
      try {
        const data = await fetchDashboard();
        if (!isMounted) return;
        setState({ data, isLoading: false, error: null });
      } catch (error) {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : "Falha ao atualizar dashboard.";
        setState((current) => ({
          data: current.data,
          isLoading: false,
          error: current.data ? current.error : message,
        }));
      }
    };

    const connectStream = () => {
      stream = createDashboardStream();

      stream.addEventListener("dashboard", (event) => {
        if (!isMounted) return;

        const nextData = JSON.parse((event as MessageEvent<string>).data) as DashboardPayload;
        setState({ data: nextData, isLoading: false, error: null });
      });

      stream.onerror = () => {
        if (!isMounted) return;
        setState((current) => ({
          ...current,
          error: current.data ? null : "Nao foi possivel conectar ao stream do dashboard.",
        }));
      };
    };

    void refreshDashboard();
    connectStream();

    const pollingInterval = setInterval(() => {
      void refreshDashboard();
    }, 30_000);

    return () => {
      isMounted = false;
      clearInterval(pollingInterval);
      stream?.close();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const derived = useMemo(() => {
    if (!state.data) return null;

    const secondsSinceUpdate = Math.max(
      0,
      Math.floor((nowMs - new Date(state.data.summary.lastUpdatedAt).getTime()) / 1000),
    );

    return {
      ...state.data,
      secondsSinceUpdate,
    };
  }, [nowMs, state.data]);

  return {
    ...state,
    data: derived,
  };
}
