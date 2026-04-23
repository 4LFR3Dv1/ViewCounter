import { getDashboardPayload } from "../services/dashboard-service";
import { appendManualSnapshot, updateAccountStatus } from "../repositories/dashboard-repository";
export async function registerDashboardRoutes(app) {
    app.get("/api/dashboard", async () => getDashboardPayload());
    app.get("/api/dashboard/summary", async () => (await getDashboardPayload()).summary);
    app.get("/api/dashboard/platforms", async () => (await getDashboardPayload()).platforms);
    app.get("/api/dashboard/accounts", async () => (await getDashboardPayload()).accounts);
    app.get("/api/dashboard/chart", async () => (await getDashboardPayload()).chart);
    app.get("/api/dashboard/events", async () => (await getDashboardPayload()).events);
    app.get("/api/dashboard/cases", async () => (await getDashboardPayload()).cases);
    app.get("/api/dashboard/health", async () => {
        const payload = await getDashboardPayload();
        return {
            health: payload.health,
            warnings: payload.warnings,
        };
    });
    app.post("/api/admin/manual-snapshot", async (request) => {
        await appendManualSnapshot(request.body);
        return getDashboardPayload();
    });
    app.post("/api/admin/account-status", async (request) => {
        await updateAccountStatus(request.body);
        return getDashboardPayload();
    });
}
