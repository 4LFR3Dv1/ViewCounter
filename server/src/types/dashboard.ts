export type PlatformSlug = "instagram" | "youtube" | "tiktok";

export type ConnectionStatus =
  | "connected"
  | "syncing"
  | "warning"
  | "disconnected"
  | "expired"
  | "pending_auth"
  | "pending_approval"
  | "manual_mode";

export interface DashboardSummary {
  viewsTotal: number;
  accountsCovered: number;
  accountsTotal: number;
  lastUpdatedAt: string;
  deltaPercentage: number;
  activeWindowLabel: string;
}

export interface DashboardSeriesPoint {
  label: string;
  total: number;
}

export interface PlatformCardData {
  id: string;
  platform: string;
  slug: PlatformSlug;
  views: number;
  change: number;
  color: string;
  status: ConnectionStatus;
  accountsCovered: number;
  accountsTotal: number;
  sparkline: number[];
}

export interface AccountCardData {
  id: string;
  displayName: string;
  handle: string;
  platform: string;
  slug: PlatformSlug;
  color: string;
  views: number;
  delta: number;
  status: ConnectionStatus;
  lastSyncedAt: string;
  coverageLabel: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  platform: string;
  before: number;
  after: number;
  growth: number;
  strategy: string;
  thumbnail?: string;
  chartData: number[];
  color: string;
  status: "live" | "stable" | "archived";
}

export interface ActivityEvent {
  id: string;
  platform: string;
  slug: PlatformSlug;
  text: string;
  color: string;
  createdAt: string;
}

export interface DashboardWarning {
  id: string;
  accountId: string;
  title: string;
  description: string;
  severity: "info" | "warning";
}

export interface DashboardHealth {
  coverageRatio: number;
  healthyAccounts: number;
  staleAccounts: number;
  manualAccounts: number;
}

export interface DashboardPayload {
  summary: DashboardSummary;
  chart: DashboardSeriesPoint[];
  platforms: PlatformCardData[];
  accounts: AccountCardData[];
  events: ActivityEvent[];
  cases: CaseStudy[];
  warnings: DashboardWarning[];
  health: DashboardHealth;
}
