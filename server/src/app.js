import Fastify from "fastify";
import cookie from "@fastify/cookie";
import cors from "@fastify/cors";
import { startTikTokSyncScheduler } from "./jobs/tiktok-sync-job";
import { startYouTubeSyncScheduler } from "./jobs/youtube-sync-job";
import { registerAdminRoutes } from "./routes/admin";
import { registerAuthRoutes } from "./routes/auth";
import { registerDashboardRoutes } from "./routes/dashboard";
import { getActiveDataProvider } from "./repositories/dashboard-repository";
import { getDashboardPayload } from "./services/dashboard-service";
import { pingPostgres } from "./db/postgres";
const app = Fastify({
    logger: true,
    trustProxy: true,
});
const port = Number(process.env.PORT ?? 8787);
function getAllowedOrigins() {
    const configuredOrigins = (process.env.ALLOWED_ORIGINS ?? "")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean);
    if (configuredOrigins.length > 0) {
        return configuredOrigins;
    }
    const frontendAppUrl = process.env.FRONTEND_APP_URL ?? "http://localhost:5173";
    return [
        frontendAppUrl,
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ];
}
const allowedOrigins = new Set(getAllowedOrigins());
await app.register(cors, {
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`Origin nao permitida por CORS: ${origin}`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
});
await app.register(cookie);
app.addHook("onSend", async (_request, reply, payload) => {
    reply.header("X-Frame-Options", "DENY");
    reply.header("X-Content-Type-Options", "nosniff");
    reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
    reply.header("Cross-Origin-Resource-Policy", "cross-origin");
    reply.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    return payload;
});
await registerDashboardRoutes(app);
await registerAuthRoutes(app);
await registerAdminRoutes(app);
app.get("/stream", async (request, reply) => {
    reply.raw.setHeader("Content-Type", "text/event-stream");
    reply.raw.setHeader("Cache-Control", "no-cache, no-transform");
    reply.raw.setHeader("Connection", "keep-alive");
    reply.raw.flushHeaders?.();
    const sendPayload = async () => {
        const payload = JSON.stringify(await getDashboardPayload());
        reply.raw.write(`event: dashboard\n`);
        reply.raw.write(`data: ${payload}\n\n`);
    };
    await sendPayload();
    const interval = setInterval(() => {
        void sendPayload();
    }, 15000);
    request.raw.on("close", () => {
        clearInterval(interval);
        reply.raw.end();
    });
});
app.get("/health", async () => ({
    ok: true,
    dataProvider: getActiveDataProvider(),
    timestamp: new Date().toISOString(),
}));
if (getActiveDataProvider() === "postgres") {
    try {
        await pingPostgres();
        app.log.info("Conexao com Postgres validada para DATA_PROVIDER=postgres");
    }
    catch (error) {
        app.log.error(error, "Falha ao conectar no Postgres");
        throw error;
    }
}
startYouTubeSyncScheduler(app.log);
startTikTokSyncScheduler(app.log);
app.listen({ port, host: "0.0.0.0" }).catch((error) => {
    app.log.error(error);
    process.exit(1);
});
