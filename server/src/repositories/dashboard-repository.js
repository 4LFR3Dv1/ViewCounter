import { appendManualSnapshot as appendJsonManualSnapshot, listSyncJobs as listJsonSyncJobs, listTikTokConnections as listJsonTikTokConnections, listYouTubeConnections as listJsonYouTubeConnections, loadDashboardStore as loadJsonDashboardStore, persistTikTokSyncResult as persistJsonTikTokSyncResult, persistYouTubeSyncResult as persistJsonYouTubeSyncResult, recordSyncJob as recordJsonSyncJob, updateAccountStatus as updateJsonAccountStatus, upsertTikTokConnection as upsertJsonTikTokConnection, upsertYouTubeConnection as upsertJsonYouTubeConnection, } from "./dashboard-store-repository";
import { appendManualSnapshot as appendPostgresManualSnapshot, listSyncJobs as listPostgresSyncJobs, listTikTokConnections as listPostgresTikTokConnections, listYouTubeConnections as listPostgresYouTubeConnections, loadDashboardStore as loadPostgresDashboardStore, persistTikTokSyncResult as persistPostgresTikTokSyncResult, persistYouTubeSyncResult as persistPostgresYouTubeSyncResult, recordSyncJob as recordPostgresSyncJob, updateAccountStatus as updatePostgresAccountStatus, upsertTikTokConnection as upsertPostgresTikTokConnection, upsertYouTubeConnection as upsertPostgresYouTubeConnection, } from "./postgres-dashboard-repository";
function getDataProvider() {
    const provider = (process.env.DATA_PROVIDER ?? "json").toLowerCase();
    return provider === "postgres" ? "postgres" : "json";
}
export function getActiveDataProvider() {
    return getDataProvider();
}
export async function loadDashboardStore() {
    return getDataProvider() === "postgres" ? loadPostgresDashboardStore() : loadJsonDashboardStore();
}
export async function appendManualSnapshot(params) {
    return getDataProvider() === "postgres"
        ? appendPostgresManualSnapshot(params)
        : appendJsonManualSnapshot(params);
}
export async function updateAccountStatus(params) {
    return getDataProvider() === "postgres"
        ? updatePostgresAccountStatus(params)
        : updateJsonAccountStatus(params);
}
export async function upsertYouTubeConnection(params) {
    return getDataProvider() === "postgres"
        ? upsertPostgresYouTubeConnection(params)
        : upsertJsonYouTubeConnection(params);
}
export async function upsertTikTokConnection(params) {
    return getDataProvider() === "postgres"
        ? upsertPostgresTikTokConnection(params)
        : upsertJsonTikTokConnection(params);
}
export async function listYouTubeConnections() {
    return getDataProvider() === "postgres"
        ? listPostgresYouTubeConnections()
        : listJsonYouTubeConnections();
}
export async function listTikTokConnections() {
    return getDataProvider() === "postgres"
        ? listPostgresTikTokConnections()
        : listJsonTikTokConnections();
}
export async function persistYouTubeSyncResult(params) {
    return getDataProvider() === "postgres"
        ? persistPostgresYouTubeSyncResult(params)
        : persistJsonYouTubeSyncResult(params);
}
export async function persistTikTokSyncResult(params) {
    return getDataProvider() === "postgres"
        ? persistPostgresTikTokSyncResult(params)
        : persistJsonTikTokSyncResult(params);
}
export async function recordSyncJob(job) {
    return getDataProvider() === "postgres"
        ? recordPostgresSyncJob(job)
        : recordJsonSyncJob(job);
}
export async function listSyncJobs(params) {
    return getDataProvider() === "postgres"
        ? listPostgresSyncJobs(params)
        : listJsonSyncJobs(params);
}
