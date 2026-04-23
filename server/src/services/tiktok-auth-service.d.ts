export declare function buildTikTokStartPayload(returnTo?: string): {
    state: string;
    returnTo: string;
    authorizationUrl: string;
};
export declare function getTikTokFrontendAppUrl(): string;
export declare function handleTikTokOAuthCallback(code: string): Promise<{
    accountId: string;
    displayName: string;
}>;
