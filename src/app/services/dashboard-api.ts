import type { DashboardPayload } from "../types/dashboard";
import type { AdminConnectionsOverview, AdminSyncJobItem } from "../types/admin";

function getApiBaseUrl() {
  return import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";
}

function buildUrl(path: string) {
  const baseUrl = getApiBaseUrl();
  return baseUrl ? `${baseUrl}${path}` : path;
}

export function getApiUrl(path: string) {
  return buildUrl(path);
}

export async function fetchDashboard(): Promise<DashboardPayload> {
  const response = await fetch(buildUrl("/api/dashboard"));

  if (!response.ok) {
    throw new Error(`Falha ao carregar dashboard: ${response.status}`);
  }

  return response.json();
}

export async function fetchAdminConnections(): Promise<AdminConnectionsOverview> {
  const response = await fetch(buildUrl("/api/admin/connections"));

  if (!response.ok) {
    throw new Error(`Falha ao carregar conexoes: ${response.status}`);
  }

  return response.json();
}

export async function fetchAdminSyncJobs(): Promise<AdminSyncJobItem[]> {
  const response = await fetch(buildUrl("/api/admin/sync-jobs"));

  if (!response.ok) {
    throw new Error(`Falha ao carregar historico de sync: ${response.status}`);
  }

  return response.json();
}

export async function triggerYouTubeSync(connectionId?: string) {
  const response = await fetch(
    buildUrl(connectionId ? `/api/admin/youtube/sync/${connectionId}` : "/api/admin/youtube/sync"),
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(`Falha ao sincronizar YouTube: ${response.status}`);
  }

  return response.json();
}

export async function triggerTikTokSync(connectionId?: string) {
  const response = await fetch(
    buildUrl(connectionId ? `/api/admin/tiktok/sync/${connectionId}` : "/api/admin/tiktok/sync"),
    {
      method: "POST",
    },
  );

  if (!response.ok) {
    throw new Error(`Falha ao sincronizar TikTok: ${response.status}`);
  }

  return response.json();
}

export function createDashboardStream() {
  return new EventSource(buildUrl("/stream"));
}
