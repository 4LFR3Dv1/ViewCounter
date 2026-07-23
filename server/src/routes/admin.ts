import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { getAdminConnectionsOverview, getAdminSyncJobs } from "../services/admin-overview-service.js";
import { syncAllTikTokConnections, syncTikTokConnectionById } from "../services/tiktok-sync-service.js";
import { syncAllYouTubeConnections, syncYouTubeConnectionById } from "../services/youtube-sync-service.js";

export async function registerAdminRoutes(app: FastifyInstance) {
  const adminOnly = { onRequest: requireAdmin };

  app.get("/api/admin/connections", adminOnly, async () => {
    return getAdminConnectionsOverview();
  });

  app.get("/api/admin/sync-jobs", adminOnly, async () => {
    return getAdminSyncJobs();
  });

  app.post("/api/admin/youtube/sync", adminOnly, async () => {
    return syncAllYouTubeConnections();
  });

  app.post<{
    Params: {
      connectionId: string;
    };
  }>("/api/admin/youtube/sync/:connectionId", adminOnly, async (request) => {
    return syncYouTubeConnectionById(request.params.connectionId);
  });

  app.post("/api/admin/tiktok/sync", adminOnly, async () => {
    return syncAllTikTokConnections();
  });

  app.post<{
    Params: {
      connectionId: string;
    };
  }>("/api/admin/tiktok/sync/:connectionId", adminOnly, async (request) => {
    return syncTikTokConnectionById(request.params.connectionId);
  });
}

async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  const configuredToken = process.env.ADMIN_TOKEN;
  if (!configuredToken) {
    return reply.code(503).send({ error: "admin_not_configured" });
  }

  const suppliedToken = request.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!suppliedToken || suppliedToken !== configuredToken) {
    return reply.code(401).send({ error: "unauthorized" });
  }
}
