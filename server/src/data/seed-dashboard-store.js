function daysAgo(days, hour = 12) {
    const date = new Date();
    date.setHours(hour, 0, 0, 0);
    date.setDate(date.getDate() - days);
    return date.toISOString();
}
function minutesAgo(minutes) {
    return new Date(Date.now() - minutes * 60_000).toISOString();
}
function buildSnapshots(accountId, totals, lastCapturedAt, source) {
    const baseline = totals.slice(0, -1).map((total, index) => ({
        id: `${accountId}-snap-${index + 1}`,
        accountId,
        capturedAt: daysAgo(totals.length - 1 - index),
        totalViews: total,
        source,
    }));
    return [
        ...baseline,
        {
            id: `${accountId}-snap-current`,
            accountId,
            capturedAt: lastCapturedAt,
            totalViews: totals.at(-1),
            source,
        },
    ];
}
function buildOldSnapshots(accountId, totals) {
    return totals.map((total, index) => ({
        id: `${accountId}-old-${index + 1}`,
        accountId,
        capturedAt: daysAgo(14 - index * 2),
        totalViews: total,
        source: "manual",
    }));
}
const events = [
    {
        id: "evt-instagram-1",
        platformSlug: "instagram",
        text: "Instagram +18,2k views hoje",
        createdAt: minutesAgo(2),
    },
    {
        id: "evt-tiktok-1",
        platformSlug: "tiktok",
        text: "TikTok com cobertura parcial sem interromper o total global",
        createdAt: minutesAgo(4),
    },
    {
        id: "evt-youtube-1",
        platformSlug: "youtube",
        text: "YouTube acima da meta semanal com 3 canais ativos",
        createdAt: minutesAgo(7),
    },
    {
        id: "evt-instagram-2",
        platformSlug: "instagram",
        text: "Novo pico de Reels no nicho de beleza",
        createdAt: minutesAgo(11),
    },
];
const cases = [
    {
        id: "case-1",
        platformSlug: "instagram",
        title: "Produto Tech",
        before: 15000,
        after: 89000,
        growth: 493,
        strategy: "Viral + Colaboracoes",
        chartData: [15000, 22000, 35000, 52000, 68000, 89000],
        status: "live",
    },
    {
        id: "case-2",
        platformSlug: "youtube",
        title: "Canal Gaming",
        before: 2400,
        after: 42000,
        growth: 1650,
        strategy: "SEO + Shorts",
        chartData: [2400, 5800, 12000, 21000, 32000, 42000],
        status: "live",
    },
    {
        id: "case-3",
        platformSlug: "tiktok",
        title: "Lifestyle",
        before: 28000,
        after: 125000,
        growth: 346,
        strategy: "Storytelling",
        chartData: [28000, 45000, 68000, 89000, 108000, 125000],
        status: "stable",
    },
    {
        id: "case-4",
        platformSlug: "tiktok",
        title: "E-commerce",
        before: 8500,
        after: 67000,
        growth: 688,
        strategy: "Trends + UGC",
        chartData: [8500, 15000, 28000, 42000, 55000, 67000],
        status: "live",
    },
];
export function createSeedDashboardStore() {
    const store = {
        version: 1,
        updatedAt: new Date().toISOString(),
        platforms: [
            { id: "platform-instagram", slug: "instagram", name: "Instagram", color: "#E1306C" },
            { id: "platform-youtube", slug: "youtube", name: "YouTube", color: "#FF0000" },
            { id: "platform-tiktok", slug: "tiktok", name: "TikTok", color: "#00f2ea" },
        ],
        accounts: [
            {
                id: "acc-ig-1",
                platformSlug: "instagram",
                displayName: "Marca de Skincare",
                handle: "@skincare.lab",
                status: "connected",
                isActive: true,
                featured: true,
                coverageNote: "Reels + Stories sincronizados",
            },
            {
                id: "acc-ig-2",
                platformSlug: "instagram",
                displayName: "E-commerce Fashion",
                handle: "@drop.fit",
                status: "connected",
                isActive: true,
                featured: true,
                coverageNote: "Conta profissional com coleta automatica",
            },
            {
                id: "acc-ig-3",
                platformSlug: "instagram",
                displayName: "Beauty Creator",
                handle: "@beauty.ops",
                status: "connected",
                isActive: true,
                featured: false,
            },
            {
                id: "acc-ig-4",
                platformSlug: "instagram",
                displayName: "Produto DTC",
                handle: "@dtc.launch",
                status: "connected",
                isActive: true,
                featured: false,
            },
            {
                id: "acc-yt-1",
                platformSlug: "youtube",
                displayName: "Canal Growth Breakdown",
                handle: "@growthbreakdown",
                status: "connected",
                isActive: true,
                featured: true,
                coverageNote: "Canal principal sincronizado por API",
            },
            {
                id: "acc-yt-2",
                platformSlug: "youtube",
                displayName: "Canal Shorts Playbook",
                handle: "@shortsplaybook",
                status: "syncing",
                isActive: true,
                featured: true,
                coverageNote: "Sincronizando lote mais recente de videos",
            },
            {
                id: "acc-yt-3",
                platformSlug: "youtube",
                displayName: "Canal Tutorials",
                handle: "@tutorials.signal",
                status: "connected",
                isActive: true,
                featured: false,
            },
            {
                id: "acc-tt-1",
                platformSlug: "tiktok",
                displayName: "Conta Viral Commerce",
                handle: "@viralcommerce",
                status: "warning",
                isActive: true,
                featured: true,
                coverageNote: "Ultimo snapshot valido mantido",
                warningNote: "A ultima coleta oficial oscilou, mas o sistema preservou o snapshot valido sem derrubar o agregado.",
            },
            {
                id: "acc-tt-2",
                platformSlug: "tiktok",
                displayName: "Lifestyle Accelerator",
                handle: "@lifestyle.acc",
                status: "manual_mode",
                isActive: true,
                featured: true,
                coverageNote: "Snapshot manual ate liberar auth oficial",
                warningNote: "Conta mantida em modo manual para nao interromper a cobertura visual e o total consolidado.",
            },
            {
                id: "acc-tt-3",
                platformSlug: "tiktok",
                displayName: "Creator Expansion",
                handle: "@creator.expansion",
                status: "pending_auth",
                isActive: true,
                featured: false,
                warningNote: "Conta aguardando autorizacao oficial. Fora do total ativo sem impactar o layout.",
            },
            {
                id: "acc-tt-4",
                platformSlug: "tiktok",
                displayName: "Retail Shorts",
                handle: "@retail.shorts",
                status: "pending_approval",
                isActive: true,
                featured: false,
                warningNote: "Conta aguardando aprovacao de permissao. Mantida fora da malha ativa ate conclusao.",
            },
        ],
        connections: [],
        snapshots: [
            ...buildSnapshots("acc-ig-1", [820000, 870000, 930000, 1010000, 1095000, 1135000, 1184200], minutesAgo(18), "api"),
            ...buildSnapshots("acc-ig-2", [700000, 760000, 805000, 842000, 874000, 908000, 942800], minutesAgo(24), "api"),
            ...buildSnapshots("acc-ig-3", [880000, 900000, 914000, 926000, 932000, 938000, 945000], minutesAgo(32), "api"),
            ...buildSnapshots("acc-ig-4", [820000, 835000, 850000, 862000, 874000, 882000, 890800], minutesAgo(27), "api"),
            ...buildSnapshots("acc-yt-1", [1950000, 2050000, 2140000, 2225000, 2308000, 2360000, 2415000], minutesAgo(12), "api"),
            ...buildSnapshots("acc-yt-2", [1450000, 1490000, 1548000, 1599000, 1635000, 1662000, 1693800], minutesAgo(52), "api"),
            ...buildSnapshots("acc-yt-3", [910000, 960000, 1005000, 1050000, 1089000, 1114000, 1133100], minutesAgo(16), "api"),
            ...buildSnapshots("acc-tt-1", [1500000, 1600000, 1695000, 1778000, 1842000, 1884000, 1919220], minutesAgo(61), "api"),
            ...buildSnapshots("acc-tt-2", [1450000, 1538000, 1612000, 1669000, 1694000, 1711000, 1723400], minutesAgo(143), "manual"),
            ...buildOldSnapshots("acc-tt-3", [220000, 248000, 273000]),
            ...buildOldSnapshots("acc-tt-4", [180000, 206000, 233000]),
        ],
        events,
        cases,
        syncJobs: [],
    };
    return store;
}
