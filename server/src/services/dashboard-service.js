import { loadDashboardStore } from "../repositories/dashboard-repository";
import { aggregateDashboard } from "./dashboard-aggregator";
export async function getDashboardPayload() {
    const store = await loadDashboardStore();
    return aggregateDashboard(store);
}
