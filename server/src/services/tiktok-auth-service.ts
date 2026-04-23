import crypto from "node:crypto";
import { upsertTikTokConnection } from "../repositories/dashboard-repository";
import { getFrontendAppUrl } from "./youtube-auth-service";
import { fetchTikTokAccountSnapshot } from "./tiktok-sync-service";

const TIKTOK_OAUTH_SCOPE = ["user.info.basic", "video.list"];

interface TikTokTokenResponse {
  access_token: string;
  expires_in: number;
  open_id: string;
  refresh_expires_in?: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} nao definido`);
  }
  return value;
}

export function buildTikTokStartPayload(returnTo?: string) {
  const clientKey = getRequiredEnv("TIKTOK_CLIENT_KEY");
  const redirectUri = getRequiredEnv("TIKTOK_REDIRECT_URI");
  const state = crypto.randomBytes(24).toString("hex");
  const safeReturnTo = returnTo && returnTo.startsWith("/") ? returnTo : "/";
  const authorizationUrl = new URL("https://www.tiktok.com/v2/auth/authorize/");

  authorizationUrl.searchParams.set("client_key", clientKey);
  authorizationUrl.searchParams.set("response_type", "code");
  authorizationUrl.searchParams.set("scope", TIKTOK_OAUTH_SCOPE.join(","));
  authorizationUrl.searchParams.set("redirect_uri", redirectUri);
  authorizationUrl.searchParams.set("state", state);

  return {
    state,
    returnTo: safeReturnTo,
    authorizationUrl: authorizationUrl.toString(),
  };
}

export function getTikTokFrontendAppUrl() {
  return getFrontendAppUrl();
}

async function exchangeCodeForTokens(code: string) {
  const clientKey = getRequiredEnv("TIKTOK_CLIENT_KEY");
  const clientSecret = getRequiredEnv("TIKTOK_CLIENT_SECRET");
  const redirectUri = getRequiredEnv("TIKTOK_REDIRECT_URI");

  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Cache-Control": "no-cache",
    },
    body: new URLSearchParams({
      client_key: clientKey,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    throw new Error(`Falha ao trocar code por tokens no TikTok: ${response.status}`);
  }

  return (await response.json()) as TikTokTokenResponse;
}

export async function handleTikTokOAuthCallback(code: string) {
  const tokenResponse = await exchangeCodeForTokens(code);
  const snapshot = await fetchTikTokAccountSnapshot(tokenResponse.access_token);
  const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString();
  const scopes = tokenResponse.scope.split(",").map((scope) => scope.trim()).filter(Boolean);

  await upsertTikTokConnection({
    providerAccountId: tokenResponse.open_id ?? snapshot.providerAccountId,
    displayName: snapshot.displayName,
    handle: snapshot.handle,
    totalViews: snapshot.totalViews,
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    scopes,
    expiresAt,
    rawProfile: snapshot.rawProfile,
  });

  return {
    accountId: `acc-tt-${tokenResponse.open_id ?? snapshot.providerAccountId}`,
    displayName: snapshot.displayName,
  };
}
