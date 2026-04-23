import type {
  ActivityEvent,
  CaseStudy,
  ConnectionStatus,
  DashboardHealth,
  DashboardPayload,
  DashboardSeriesPoint,
  DashboardSummary,
  PlatformCardData,
  PlatformSlug,
} from "../types/dashboard.js";
import type { DashboardStore, PersistedAccount, PersistedMetricSnapshot, PersistedPlatform } from "../types/store.js";

type SnapshotMap = Map<string, PersistedMetricSnapshot[]>;

const coveredStatuses = new Set<ConnectionStatus>(["connected", "syncing", "warning", "manual_mode"]);
const healthyStatuses = new Set<ConnectionStatus>(["connected", "syncing"]);
const staleStatuses = new Set<ConnectionStatus>(["warning", "expired", "disconnected"]);

function roundPercentage(value: number) {
  return Math.round(value * 10) / 10;
}

function toDayKey(dateLike: string) {
  return new Date(dateLike).toISOString().slice(0, 10);
}

function getSnapshotsByAccount(store: DashboardStore): SnapshotMap {
  return store.snapshots.reduce<SnapshotMap>((map, snapshot) => {
    const current = map.get(snapshot.accountId) ?? [];
    current.push(snapshot);
    current.sort((left, right) => new Date(left.capturedAt).getTime() - new Date(right.capturedAt).getTime());
    map.set(snapshot.accountId, current);
    return map;
  }, new Map());
}

function getLatestSnapshot(snapshots: PersistedMetricSnapshot[]) {
  return snapshots.at(-1) ?? null;
}

function isCoveredAccount(account: PersistedAccount, latestSnapshot: PersistedMetricSnapshot | null) {
  return account.isActive && latestSnapshot !== null && coveredStatuses.has(account.status);
}

function calculateDelta(current: number, previous: number | null) {
  if (previous === null || previous <= 0) return 0;
  return roundPercentage(((current - previous) / previous) * 100);
}

function formatLabel(dateLike: string) {
  const date = new Date(dateLike);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date
    .toLocaleString("pt-BR", { month: "short" })
    .replace(".", "")
    .replace(/^\w/, (character) => character.toUpperCase());
  return `${day} ${month}`;
}

function sumSnapshotForDay(snapshots: PersistedMetricSnapshot[], dayKey: string) {
  const match = snapshots.find((snapshot) => toDayKey(snapshot.capturedAt) === dayKey);
  return match?.totalViews ?? 0;
}

function buildGlobalChart(store: DashboardStore, snapshotsByAccount: SnapshotMap) {
  const coveredAccounts = store.accounts.filter((account) =>
    isCoveredAccount(account, getLatestSnapshot(snapshotsByAccount.get(account.id) ?? [])),
  );
  const dayKeys = new Set<string>();

  for (const account of coveredAccounts) {
    const snapshots = snapshotsByAccount.get(account.id) ?? [];
    for (const snapshot of snapshots.slice(-7)) {
      dayKeys.add(toDayKey(snapshot.capturedAt));
    }
  }

  const orderedDates = [...dayKeys]
    .sort((left, right) => left.localeCompare(right))
    .slice(-7);

  return orderedDates.map((capturedAt) => {
    const total = coveredAccounts.reduce((sum, account) => {
      const snapshots = snapshotsByAccount.get(account.id) ?? [];
      return sum + sumSnapshotForDay(snapshots, capturedAt);
    }, 0);

    return {
      label: formatLabel(capturedAt),
      total,
    };
  });
}

function buildPlatformSparkline(
  platformSlug: PlatformSlug,
  store: DashboardStore,
  snapshotsByAccount: SnapshotMap,
  chartDates: string[],
) {
  const accounts = store.accounts.filter((account) => account.platformSlug === platformSlug);

  return chartDates.map((capturedAt) =>
    accounts.reduce((sum, account) => {
      const latestSnapshot = getLatestSnapshot(snapshotsByAccount.get(account.id) ?? []);
      if (!isCoveredAccount(account, latestSnapshot)) {
        return sum;
      }

      return sum + sumSnapshotForDay(snapshotsByAccount.get(account.id) ?? [], capturedAt);
    }, 0),
  );
}

function resolvePlatformStatus(accounts: PersistedAccount[], coveredCount: number) {
  if (accounts.length === 0) return "pending_auth";
  if (coveredCount < accounts.length) return "warning";
  if (accounts.some((account) => account.status === "manual_mode")) return "manual_mode";
  if (accounts.some((account) => account.status === "syncing")) return "syncing";
  return "connected";
}

function buildPlatformCards(
  store: DashboardStore,
  snapshotsByAccount: SnapshotMap,
  chartDates: string[],
): PlatformCardData[] {
  return store.platforms.map((platform) => {
    const accounts = store.accounts.filter((account) => account.platformSlug === platform.slug && account.isActive);
    const coveredAccounts = accounts.filter((account) =>
      isCoveredAccount(account, getLatestSnapshot(snapshotsByAccount.get(account.id) ?? [])),
    );
    const totals = coveredAccounts.map((account) => getLatestSnapshot(snapshotsByAccount.get(account.id) ?? [])?.totalViews ?? 0);
    const previousTotals = coveredAccounts.map((account) => {
      const snapshots = snapshotsByAccount.get(account.id) ?? [];
      return snapshots.at(-2)?.totalViews ?? null;
    });

    const current = totals.reduce((sum, total) => sum + total, 0);
    const previous = previousTotals.reduce<number>((sum, total) => sum + (total ?? 0), 0);

    return {
      id: platform.id,
      platform: platform.name,
      slug: platform.slug,
      views: current,
      change: calculateDelta(current, previous > 0 ? previous : null),
      color: platform.color,
      status: resolvePlatformStatus(accounts, coveredAccounts.length),
      accountsCovered: coveredAccounts.length,
      accountsTotal: accounts.length,
      sparkline: buildPlatformSparkline(platform.slug, store, snapshotsByAccount, chartDates),
    };
  });
}

function buildAccountCards(
  store: DashboardStore,
  snapshotsByAccount: SnapshotMap,
  platformBySlug: Map<PlatformSlug, PersistedPlatform>,
) {
  return store.accounts
    .filter((account) => account.featured)
    .map((account) => {
      const snapshots = snapshotsByAccount.get(account.id) ?? [];
      const latest = getLatestSnapshot(snapshots);
      const previous = snapshots.at(-2) ?? null;
      const platform = platformBySlug.get(account.platformSlug)!;
      const platformAccounts = store.accounts.filter(
        (item) => item.platformSlug === account.platformSlug && item.isActive,
      );
      const coveredCount = platformAccounts.filter((item) =>
        isCoveredAccount(item, getLatestSnapshot(snapshotsByAccount.get(item.id) ?? [])),
      ).length;

      return {
        id: account.id,
        displayName: account.displayName,
        handle: account.handle,
        platform: platform.name,
        slug: account.platformSlug,
        color: platform.color,
        views: latest?.totalViews ?? 0,
        delta: calculateDelta(latest?.totalViews ?? 0, previous?.totalViews ?? null),
        status: account.status,
        lastSyncedAt: latest?.capturedAt ?? store.updatedAt,
        coverageLabel:
          account.coverageNote ??
          `${coveredCount}/${platformAccounts.length} contas de ${platform.name} ativas`,
      };
    });
}

function buildWarnings(
  store: DashboardStore,
  snapshotsByAccount: SnapshotMap,
  platformBySlug: Map<PlatformSlug, PersistedPlatform>,
) {
  return store.accounts
    .filter((account) => !healthyStatuses.has(account.status))
    .map((account) => {
      const platform = platformBySlug.get(account.platformSlug)!;
      const latest = getLatestSnapshot(snapshotsByAccount.get(account.id) ?? []);

      return {
        id: `warn-${account.id}`,
        accountId: account.id,
        title: `${platform.name}: ${account.displayName}`,
        description:
          account.warningNote ??
          `Conta em estado ${account.status}. O layout permanece operacional usando a politica de cobertura parcial do backend.`,
        severity:
          account.status === "warning" || account.status === "expired" || account.status === "disconnected"
            ? ("warning" as const)
            : ("info" as const),
        latest,
      };
    })
    .sort((left, right) => (left.severity === right.severity ? 0 : left.severity === "warning" ? -1 : 1))
    .slice(0, 4)
    .map(({ latest: _latest, ...warning }) => warning);
}

function findEventAccount(event: { text: string; platformSlug: PlatformSlug }, store: DashboardStore) {
  const normalizedText = event.text.toLowerCase();

  return store.accounts.find((account) => {
    if (account.platformSlug !== event.platformSlug) return false;
    const displayName = account.displayName.toLowerCase();
    const handle = account.handle.toLowerCase();
    return normalizedText.includes(displayName) || normalizedText.includes(handle);
  });
}

function getSnapshotForEvent(snapshots: PersistedMetricSnapshot[], eventCreatedAt: string) {
  const eventTime = new Date(eventCreatedAt).getTime();
  const ordered = snapshots
    .filter((snapshot) => new Date(snapshot.capturedAt).getTime() <= eventTime + 1000)
    .sort((left, right) => new Date(left.capturedAt).getTime() - new Date(right.capturedAt).getTime());

  const current = ordered.at(-1) ?? null;
  const previous = ordered.at(-2) ?? null;

  return { current, previous };
}

function buildEvents(
  store: DashboardStore,
  platformBySlug: Map<PlatformSlug, PersistedPlatform>,
  snapshotsByAccount: SnapshotMap,
): ActivityEvent[] {
  return [...store.events]
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 6)
    .map((event) => {
      const account = findEventAccount(event, store);
      const snapshots = account ? snapshotsByAccount.get(account.id) ?? [] : [];
      const { current, previous } = getSnapshotForEvent(snapshots, event.createdAt);
      const viewsDelta = current && previous ? Math.max(0, current.totalViews - previous.totalViews) : 0;

      return {
        id: event.id,
        platform: platformBySlug.get(event.platformSlug)?.name ?? event.platformSlug,
        slug: event.platformSlug,
        text: event.text,
        color: platformBySlug.get(event.platformSlug)?.color ?? "#ffffff",
        createdAt: event.createdAt,
        accountId: account?.id,
        accountName: account?.displayName,
        viewsTotal: current?.totalViews,
        viewsDelta,
        deltaPercentage: current ? calculateDelta(current.totalViews, previous?.totalViews ?? null) : undefined,
      };
    });
}

function buildCases(store: DashboardStore, platformBySlug: Map<PlatformSlug, PersistedPlatform>): CaseStudy[] {
  return store.cases.map((caseStudy) => ({
    id: caseStudy.id,
    title: caseStudy.title,
    platform: platformBySlug.get(caseStudy.platformSlug)?.name ?? caseStudy.platformSlug,
    before: caseStudy.before,
    after: caseStudy.after,
    growth: caseStudy.growth,
    strategy: caseStudy.strategy,
    thumbnail: caseStudy.thumbnail,
    chartData: caseStudy.chartData,
    color: platformBySlug.get(caseStudy.platformSlug)?.color ?? "#ffffff",
    status: caseStudy.status,
  }));
}

function buildHealth(store: DashboardStore, snapshotsByAccount: SnapshotMap): DashboardHealth {
  const activeAccounts = store.accounts.filter((account) => account.isActive);
  const covered = activeAccounts.filter((account) =>
    isCoveredAccount(account, getLatestSnapshot(snapshotsByAccount.get(account.id) ?? [])),
  ).length;

  return {
    coverageRatio: activeAccounts.length === 0 ? 0 : covered / activeAccounts.length,
    healthyAccounts: activeAccounts.filter((account) => healthyStatuses.has(account.status)).length,
    staleAccounts: activeAccounts.filter((account) => staleStatuses.has(account.status)).length,
    manualAccounts: activeAccounts.filter((account) => account.status === "manual_mode").length,
  };
}

function buildSummary(chart: DashboardSeriesPoint[], store: DashboardStore, coveredAccounts: PersistedAccount[], snapshotsByAccount: SnapshotMap): DashboardSummary {
  const lastPoint = chart.at(-1);
  const firstPoint = chart.at(0);
  const lastUpdatedAt = coveredAccounts.reduce((latest, account) => {
    const snapshot = getLatestSnapshot(snapshotsByAccount.get(account.id) ?? []);
    if (!snapshot) return latest;
    if (!latest) return snapshot.capturedAt;
    return new Date(snapshot.capturedAt).getTime() > new Date(latest).getTime() ? snapshot.capturedAt : latest;
  }, "" as string);

  return {
    viewsTotal: lastPoint?.total ?? 0,
    accountsCovered: coveredAccounts.length,
    accountsTotal: store.accounts.filter((account) => account.isActive).length,
    lastUpdatedAt: lastUpdatedAt || store.updatedAt,
    deltaPercentage:
      firstPoint && firstPoint.total > 0 && lastPoint
        ? calculateDelta(lastPoint.total, firstPoint.total)
        : 0,
    activeWindowLabel: "ultimos 7 snapshots",
  };
}

export function aggregateDashboard(store: DashboardStore): DashboardPayload {
  const snapshotsByAccount = getSnapshotsByAccount(store);
  const platformBySlug = new Map(store.platforms.map((platform) => [platform.slug, platform]));
  const chart = buildGlobalChart(store, snapshotsByAccount);
  const coveredAccounts = store.accounts.filter((account) =>
    isCoveredAccount(account, getLatestSnapshot(snapshotsByAccount.get(account.id) ?? [])),
  );
  const chartDayKeys = [...new Set(
    coveredAccounts.flatMap((account) =>
      (snapshotsByAccount.get(account.id) ?? []).slice(-7).map((snapshot) => toDayKey(snapshot.capturedAt)),
    ),
  )]
    .sort((left, right) => left.localeCompare(right))
    .slice(-7);

  return {
    summary: buildSummary(chart, store, coveredAccounts, snapshotsByAccount),
    chart,
    platforms: buildPlatformCards(store, snapshotsByAccount, chartDayKeys),
    accounts: buildAccountCards(store, snapshotsByAccount, platformBySlug),
    events: buildEvents(store, platformBySlug, snapshotsByAccount),
    cases: buildCases(store, platformBySlug),
    warnings: buildWarnings(store, snapshotsByAccount, platformBySlug),
    health: buildHealth(store, snapshotsByAccount),
  };
}
