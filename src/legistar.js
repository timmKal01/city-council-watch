const USER_AGENT = 'CityCouncilWatch/0.1 (+contact: city-council-watch-admin@example.com)';

const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const REQUEST_TIMEOUT_MS = 15_000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchJson(url) {
    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let res;
        try {
            res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' }, signal: controller.signal });
        } catch (err) {
            lastError = err.name === 'AbortError' ? new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms: ${url}`) : err;
            if (attempt < MAX_ATTEMPTS) {
                await sleep(1000 * 2 ** (attempt - 1));
                continue;
            }
            throw lastError;
        } finally {
            clearTimeout(timeoutId);
        }
        if (res.ok) return res.json();
        if (!TRANSIENT_STATUSES.has(res.status)) {
            throw new Error(`Request failed: ${url} (${res.status})`);
        }
        lastError = new Error(`Request failed: ${url} (${res.status})`);
        if (attempt < MAX_ATTEMPTS) await sleep(1000 * 2 ** (attempt - 1));
    }
    throw lastError;
}

function odataDate(dateStr) {
    return `datetime'${dateStr}'`;
}

/** Standard Legistar public-site URL pattern for a matter (legislation) detail page. */
function matterUrl(client, matterId, matterGuid) {
    return `https://${client}.legistar.com/LegislationDetail.aspx?ID=${matterId}&GUID=${matterGuid}`;
}

export async function fetchMatters(client, sinceDate) {
    const filter = encodeURIComponent(`MatterIntroDate ge ${odataDate(sinceDate)}`);
    const url = `https://webapi.legistar.com/v1/${encodeURIComponent(client)}/matters?$filter=${filter}&$orderby=MatterIntroDate desc`;
    const rows = await fetchJson(url);
    return rows.map((m) => ({
        matterId: m.MatterId,
        file: m.MatterFile,
        title: m.MatterTitle,
        type: m.MatterTypeName,
        status: m.MatterStatusName,
        body: m.MatterBodyName,
        introDate: m.MatterIntroDate,
        agendaDate: m.MatterAgendaDate,
        passedDate: m.MatterPassedDate,
        url: matterUrl(client, m.MatterId, m.MatterGuid),
    }));
}

export async function fetchUpcomingEvents(client, fromDate) {
    const filter = encodeURIComponent(`EventDate ge ${odataDate(fromDate)}`);
    const url = `https://webapi.legistar.com/v1/${encodeURIComponent(client)}/events?$filter=${filter}&$orderby=EventDate asc`;
    const rows = await fetchJson(url);
    return rows.map((e) => ({
        eventId: e.EventId,
        body: e.EventBodyName,
        date: e.EventDate,
        time: e.EventTime,
        location: e.EventLocation,
        agendaStatus: e.EventAgendaStatusName,
        agendaFile: e.EventAgendaFile,
        url: e.EventInSiteURL,
    }));
}
