export declare function getFrontendAppUrl(): string;
export declare function buildYouTubeStartPayload(returnTo?: string): {
    state: string;
    returnTo: string;
    authorizationUrl: string;
};
export declare function handleYouTubeOAuthCallback(code: string): Promise<{
    accountId: string;
    channelTitle: string;
}>;
