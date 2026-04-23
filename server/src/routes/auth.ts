import type { FastifyInstance } from "fastify";
import {
  buildTikTokStartPayload,
  getTikTokFrontendAppUrl,
  handleTikTokOAuthCallback,
} from "../services/tiktok-auth-service.js";
import {
  buildYouTubeStartPayload,
  getFrontendAppUrl,
  handleYouTubeOAuthCallback,
} from "../services/youtube-auth-service.js";

const YOUTUBE_STATE_COOKIE = "yt_oauth_state";
const YOUTUBE_RETURN_TO_COOKIE = "yt_oauth_return_to";
const TIKTOK_STATE_COOKIE = "tt_oauth_state";
const TIKTOK_RETURN_TO_COOKIE = "tt_oauth_return_to";

function buildRedirectUrl(returnTo: string, searchParams: Record<string, string>, baseUrl = getFrontendAppUrl()) {
  const target = new URL(returnTo, baseUrl);

  for (const [key, value] of Object.entries(searchParams)) {
    target.searchParams.set(key, value);
  }

  return target.toString();
}

export async function registerAuthRoutes(app: FastifyInstance) {
  app.get<{
    Querystring: {
      returnTo?: string;
    };
  }>("/auth/youtube/start", async (request, reply) => {
    const payload = buildYouTubeStartPayload(request.query.returnTo);

    reply.setCookie(YOUTUBE_STATE_COOKIE, payload.state, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
    });

    reply.setCookie(YOUTUBE_RETURN_TO_COOKIE, payload.returnTo, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
    });

    return reply.redirect(payload.authorizationUrl);
  });

  app.get<{
    Querystring: {
      code?: string;
      state?: string;
      error?: string;
    };
  }>("/auth/youtube/callback", async (request, reply) => {
    const expectedState = request.cookies[YOUTUBE_STATE_COOKIE];
    const returnTo = request.cookies[YOUTUBE_RETURN_TO_COOKIE] ?? "/";

    reply.clearCookie(YOUTUBE_STATE_COOKIE, { path: "/" });
    reply.clearCookie(YOUTUBE_RETURN_TO_COOKIE, { path: "/" });

    if (request.query.error) {
      return reply.redirect(
        buildRedirectUrl(returnTo, {
          provider: "youtube",
          status: "error",
          reason: request.query.error,
        }),
      );
    }

    if (!request.query.code || !request.query.state || !expectedState || request.query.state !== expectedState) {
      return reply.redirect(
        buildRedirectUrl(returnTo, {
          provider: "youtube",
          status: "error",
          reason: "invalid_state",
        }),
      );
    }

    try {
      const result = await handleYouTubeOAuthCallback(request.query.code);

      return reply.redirect(
        buildRedirectUrl(returnTo, {
          provider: "youtube",
          status: "success",
          accountId: result.accountId,
        }),
      );
    } catch (error) {
      request.log.error(error, "Falha ao concluir YouTube OAuth");

      return reply.redirect(
        buildRedirectUrl(returnTo, {
          provider: "youtube",
          status: "error",
          reason: "oauth_callback_failed",
        }),
      );
    }
  });

  app.get<{
    Querystring: {
      returnTo?: string;
    };
  }>("/auth/tiktok/start", async (request, reply) => {
    const payload = buildTikTokStartPayload(request.query.returnTo);

    reply.setCookie(TIKTOK_STATE_COOKIE, payload.state, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
    });

    reply.setCookie(TIKTOK_RETURN_TO_COOKIE, payload.returnTo, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60,
    });

    return reply.redirect(payload.authorizationUrl);
  });

  app.get<{
    Querystring: {
      code?: string;
      scopes?: string;
      state?: string;
      error?: string;
      error_description?: string;
    };
  }>("/auth/tiktok/callback", async (request, reply) => {
    const expectedState = request.cookies[TIKTOK_STATE_COOKIE];
    const returnTo = request.cookies[TIKTOK_RETURN_TO_COOKIE] ?? "/";

    reply.clearCookie(TIKTOK_STATE_COOKIE, { path: "/" });
    reply.clearCookie(TIKTOK_RETURN_TO_COOKIE, { path: "/" });

    if (request.query.error) {
      return reply.redirect(
        buildRedirectUrl(
          returnTo,
          {
            provider: "tiktok",
            status: "error",
            reason: request.query.error_description ?? request.query.error,
          },
          getTikTokFrontendAppUrl(),
        ),
      );
    }

    if (!request.query.code || !request.query.state || !expectedState || request.query.state !== expectedState) {
      return reply.redirect(
        buildRedirectUrl(
          returnTo,
          {
            provider: "tiktok",
            status: "error",
            reason: "invalid_state",
          },
          getTikTokFrontendAppUrl(),
        ),
      );
    }

    try {
      const result = await handleTikTokOAuthCallback(request.query.code);

      return reply.redirect(
        buildRedirectUrl(
          returnTo,
          {
            provider: "tiktok",
            status: "success",
            accountId: result.accountId,
          },
          getTikTokFrontendAppUrl(),
        ),
      );
    } catch (error) {
      request.log.error(error, "Falha ao concluir TikTok OAuth");

      return reply.redirect(
        buildRedirectUrl(
          returnTo,
          {
            provider: "tiktok",
            status: "error",
            reason: "oauth_callback_failed",
          },
          getTikTokFrontendAppUrl(),
        ),
      );
    }
  });
}
