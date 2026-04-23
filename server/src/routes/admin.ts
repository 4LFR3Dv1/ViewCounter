import type { FastifyInstance } from "fastify";
import { getAdminConnectionsOverview, getAdminSyncJobs } from "../services/admin-overview-service.js";
import { syncAllTikTokConnections, syncTikTokConnectionById } from "../services/tiktok-sync-service.js";
import { syncAllYouTubeConnections, syncYouTubeConnectionById } from "../services/youtube-sync-service.js";

export async function registerAdminRoutes(app: FastifyInstance) {
  app.get("/api/admin/connections", async () => {
    return getAdminConnectionsOverview();
  });

  app.get("/api/admin/sync-jobs", async () => {
    return getAdminSyncJobs();
  });

  app.post("/api/admin/youtube/sync", async () => {
    return syncAllYouTubeConnections();
  });

  app.post<{
    Params: {
      connectionId: string;
    };
  }>("/api/admin/youtube/sync/:connectionId", async (request) => {
    return syncYouTubeConnectionById(request.params.connectionId);
  });

  app.post("/api/admin/tiktok/sync", async () => {
    return syncAllTikTokConnections();
  });

  app.post<{
    Params: {
      connectionId: string;
    };
  }>("/api/admin/tiktok/sync/:connectionId", async (request) => {
    return syncTikTokConnectionById(request.params.connectionId);
  });
}
