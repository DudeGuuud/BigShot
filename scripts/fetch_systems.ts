
async function fetchAllSystems(baseUrl: string) {
    let allSystems: any[] = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
        console.log(`Fetching ${baseUrl} offset=${offset}...`);
        const url = `${baseUrl}/v2/solarsystems?limit=${limit}&offset=${offset}`;
        const resp = await fetch(url);
        if (!resp.ok) {
            throw new Error(`Failed to fetch from ${baseUrl}: ${resp.statusText}`);
        }
        const body = (await resp.json()) as any;
        const data = body.data || [];
        allSystems = allSystems.concat(data);

        if (data.length < limit) {
            break;
        }
        offset += limit;
    }
    return allSystems;
}

async function run() {
    const STILLNESS_BASE = "https://world-api-stillness.live.tech.evefrontier.com";
    const UTOPIA_BASE = "https://world-api-utopia.uat.pub.evefrontier.com";

    try {
        console.log("Starting fetch from Stillness...");
        const stillnessSystems = await fetchAllSystems(STILLNESS_BASE);
        await Bun.write("dapps/src/data/systems_stillness.json", JSON.stringify(stillnessSystems, null, 2));
        console.log(`✅ Saved ${stillnessSystems.length} systems for Stillness.`);

        console.log("Starting fetch from Utopia...");
        const utopiaSystems = await fetchAllSystems(UTOPIA_BASE);
        await Bun.write("dapps/src/data/systems_utopia.json", JSON.stringify(utopiaSystems, null, 2));
        console.log(`✅ Saved ${utopiaSystems.length} systems for Utopia.`);
    } catch (e) {
        console.error("❌ Error fetching systems:", e);
        process.exit(1);
    }
}

run();
