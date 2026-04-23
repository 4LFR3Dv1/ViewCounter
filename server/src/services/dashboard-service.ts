import { loadDashboardStore } from "../repositories/dashboard-repository.js";
import { aggregateDashboard } from "./dashboard-aggregator.js";
import type { DashboardPayload } from "../types/dashboard.js";

export async function getDashboardPayload(): Promise<DashboardPayload> {
  const store = await loadDashboardStore();
  return aggregateDashboard(store);
}
