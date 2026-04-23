import crypto from "node:crypto";
import { upsertYouTubeConnection } from "../repositories/dashboard-repository";
const YOUTUBE_OAUTH_SCOPE = [
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "https://www.googleapis.com/auth/youtube.readonly",
];
function getRequiredEnv(name) {
    const value = process.env[name];
    if (!value) {
        throw new Error(`${name} nao definido`);
    }
    return value;
}
export function getFrontendAppUrl() {
    return process.env.FRONTEND_APP_URL ?? "http://localhost:5173";
}
export function buildYouTubeStartPayload(returnTo) {
    const clientId = getRequiredEnv("YOUTUBE_CLIENT_ID");
    const redirectUri = getRequiredEnv("YOUTUBE_REDIRECT_URI");
    const state = crypto.randomBytes(24).toString("hex");
    const safeReturnTo = returnTo && returnTo.startsWith("/") ? returnTo : "/";
    const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authorizationUrl.searchParams.set("client_id", clientId);
    authorizationUrl.searchParams.set("redirect_uri", redirectUri);
    authorizationUrl.searchParams.set("response_type", "code");
    authorizationUrl.searchParams.set("access_type", "offline");
    authorizationUrl.searchParams.set("include_granted_scopes", "true");
    authorizationUrl.searchParams.set("prompt", "consent");
    authorizationUrl.searchParams.set("scope", YOUTUBE_OAUTH_SCOPE.join(" "));
    authorizationUrl.searchParams.set("state", state);
    return {
        state,
        returnTo: safeReturnTo,
        authorizationUrl: authorizationUrl.toString(),
    };
}
async function exchangeCodeForTokens(code) {
    const clientId = getRequiredEnv("YOUTUBE_CLIENT_ID");
    const clientSecret = getRequiredEnv("YOUTUBE_CLIENT_SECRET");
    const redirectUri = getRequiredEnv("YOUTUBE_REDIRECT_URI");
    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            code,
            client_id: clientId,
            client_secret: clientSecret,
            redirect_uri: redirectUri,
            grant_type: "authorization_code",
        }),
    });
    if (!response.ok) {
        throw new Error(`Falha ao trocar code por tokens no Google: ${response.status}`);
    }
    return (await response.json());
}
async function fetchYouTubeChannel(accessToken) {
    const response = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    if (!response.ok) {
        throw new Error(`Falha ao buscar canal do YouTube: ${response.status}`);
    }
    const payload = (await response.json());
    const channel = payload.items?.[0];
    if (!channel?.id || !channel.snippet?.title) {
        throw new Error("Nao foi possivel identificar o canal autenticado do YouTube");
    }
    return {
        id: channel.id,
        title: channel.snippet.title,
        handle: channel.snippet.customUrl ? `@${channel.snippet.customUrl.replace(/^@/, "")}` : `channel:${channel.id}`,
        totalViews: Number(channel.statistics?.viewCount ?? 0),
        rawProfile: channel,
    };
}
export async function handleYouTubeOAuthCallback(code) {
    const tokenResponse = await exchangeCodeForTokens(code);
    const channel = await fetchYouTubeChannel(tokenResponse.access_token);
    const expiresAt = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString();
    const scopes = tokenResponse.scope.split(" ").filter(Boolean);
    await upsertYouTubeConnection({
        providerAccountId: channel.id,
        displayName: channel.title,
        handle: channel.handle,
        totalViews: channel.totalViews,
        accessToken: tokenResponse.access_token,
        refreshToken: tokenResponse.refresh_token,
        scopes,
        expiresAt,
        rawProfile: channel.rawProfile,
    });
    return {
        accountId: `acc-yt-${channel.id}`,
        channelTitle: channel.title,
    };
}
