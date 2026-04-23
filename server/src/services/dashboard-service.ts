import { loadDashboardStore } from "../repositories/dashboard-repository";
import { aggregateDashboard } from "./dashboard-aggregator";
import type { DashboardPayload } from "../types/dashboard";

export async function getDashboardPayload(): Promise<DashboardPayload> {
  const store = await loadDashboardStore();
  return aggregateDashboard(store);
}
