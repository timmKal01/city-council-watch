const USER_AGENT = 'CityCouncilWatch/0.1 (+contact: city-council-watch-admin@example.com)';

async function fetchJson(url) {
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Request failed: ${url} (${res.status})`);
    return res.json();
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
