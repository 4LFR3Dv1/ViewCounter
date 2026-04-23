import type { ConnectionStatus, PlatformSlug } from "./dashboard.js";

export interface PersistedPlatform {
  id: string;
  slug: PlatformSlug;
  name: string;
  color: string;
}

export interface PersistedAccountConnection {
  id: string;
  accountId: string;
  platformSlug: PlatformSlug;
  providerAccountId: string;
  accessToken: string;
  refreshToken?: string;
  scopes: string[];
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  rawProfile?: Record<string, unknown>;
}

export interface PersistedAccount {
  id: string;
  platformSlug: PlatformSlug;
  displayName: string;
  handle: string;
  status: ConnectionStatus;
  isActive: boolean;
  featured: boolean;
  coverageNote?: string;
  warningNote?: string;
}

export interface PersistedMetricSnapshot {
  id: string;
  accountId: string;
  capturedAt: string;
  totalViews: number;
  source: "api" | "manual";
}

export interface PersistedActivityEvent {
  id: string;
  platformSlug: PlatformSlug;
  text: string;
  createdAt: string;
}

export interface PersistedCaseStudy {
  id: string;
  platformSlug: PlatformSlug;
  title: string;
  before: number;
  after: number;
  growth: number;
  strategy: string;
  thumbnail?: string;
  chartData: number[];
  status: "live" | "stable" | "archived";
}

export interface PersistedSyncJob {
  id: string;
  platformSlug: Extract<PlatformSlug, "youtube" | "tiktok">;
  trigger: "manual" | "scheduler";
  scope: "all" | "connection";
  connectionId?: string;
  accountId?: string;
  status: "success" | "partial" | "failed";
  totalConnections: number;
  successCount: number;
  failedCount: number;
  startedAt: string;
  finishedAt: string;
  message?: string;
  error?: string;
  details?: Record<string, unknown>;
}

export interface DashboardStore {
  version: number;
  updatedAt: string;
  platforms: PersistedPlatform[];
  accounts: PersistedAccount[];
  connections: PersistedAccountConnection[];
  snapshots: PersistedMetricSnapshot[];
  events: PersistedActivityEvent[];
  cases: PersistedCaseStudy[];
  syncJobs: PersistedSyncJob[];
}
