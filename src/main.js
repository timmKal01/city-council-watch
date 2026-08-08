import { Actor, log } from 'apify';
import { fetchMatters, fetchUpcomingEvents } from './legistar.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { cities = [], sinceDate, keywordFilter = [], matterTypeFilter = [], includeUpcomingMeetings = true } = input;

if (cities.length === 0) {
    throw new Error('No cities provided.');
}
if (!sinceDate) {
    throw new Error('sinceDate is required.');
}

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const CITY_QUERIED_EVENT = 'city-queried';

function matchesKeywords(title, keywords) {
    if (!keywords || keywords.length === 0) return true;
    const lower = title.toLowerCase();
    return keywords.some((k) => lower.includes(k.toLowerCase()));
}

function matchesType(type, types) {
    if (!types || types.length === 0) return true;
    return types.includes(type);
}

const today = new Date().toISOString().slice(0, 10);

for (const city of cities) {
    const client = city.client;
    if (!client) {
        log.warning('Skipping city with no client code', { city });
        continue;
    }

    let matters = [];
    try {
        const allMatters = await fetchMatters(client, sinceDate);
        matters = allMatters.filter((m) => matchesKeywords(m.title, keywordFilter) && matchesType(m.type, matterTypeFilter));
    } catch (err) {
        log.warning('Failed to fetch matters', { client, error: err.message });
    }

    let meetings = [];
    if (includeUpcomingMeetings) {
        try {
            meetings = await fetchUpcomingEvents(client, today);
        } catch (err) {
            log.warning('Failed to fetch upcoming meetings', { client, error: err.message });
        }
    }

    if (matters.length > 0) {
        await Actor.pushData(matters.map((m) => ({ kind: 'matter', client, ...m })));
    }
    if (meetings.length > 0) {
        await Actor.pushData(meetings.map((e) => ({ kind: 'meeting', client, ...e })));
    }
    await Actor.charge({ eventName: CITY_QUERIED_EVENT });

    log.info('Queried city', { client, matters: matters.length, meetings: meetings.length });
}

await Actor.exit();
