# City Council Watch — New Ordinances & Upcoming Meetings

Give it a list of cities. Get back new ordinances/resolutions filed since a
date, and upcoming council/committee meeting agendas — pulled straight from
each city's own **Legistar** system, the software behind most US (and some
Canadian) city council websites.

Built for local journalists, government-affairs and lobbying professionals,
real-estate developers tracking zoning votes, and civic-tech researchers who
currently check multiple city council sites by hand.

## Input

```json
{
  "cities": [{ "client": "seattle" }],
  "sinceDate": "2026-07-01",
  "keywordFilter": ["zoning", "housing"],
  "matterTypeFilter": [],
  "includeUpcomingMeetings": true
}
```

| Field | Type | Description |
|---|---|---|
| `cities` | array | One entry per city: `{ "client": "seattle" }`. The client code is the subdomain of that city's Legistar site. |
| `sinceDate` | string | Only include matters introduced on or after this date (`YYYY-MM-DD`). |
| `keywordFilter` | array of strings | Only keep matters whose title contains one of these (case-insensitive). |
| `matterTypeFilter` | array of strings | Only keep matters whose type exactly matches one of these (e.g. `"Ordinance"`). |
| `includeUpcomingMeetings` | boolean | Also fetch upcoming council/committee meetings (default `true`). |

**Finding a city's client code:** open that city's council site — if it's
Legistar-powered, it'll redirect to or link `https://<client>.legistar.com`.
`seattle.legistar.com` → `"seattle"`. Not every city runs Legistar, and not
every guess matches the subdomain exactly (e.g. some counties use a
different code than their common name) — an unsupported/incorrect client
code fails that one city gracefully and the run continues with the rest.

## Output

Two kinds of records, tagged by `kind`:

```json
{
  "kind": "matter",
  "client": "seattle",
  "matterId": 17394,
  "file": "Appt 03569",
  "title": "Appointment of Kelli Larsen as Director of the Office of Housing.",
  "type": "Appointment (Appt)",
  "status": "Committee Agenda Ready",
  "body": "Housing, Arts, and Civil Rights Committee",
  "introDate": "2026-07-28T00:00:00",
  "agendaDate": "2026-08-12T00:00:00",
  "passedDate": null,
  "url": "https://seattle.legistar.com/LegislationDetail.aspx?ID=17394&GUID=..."
}
```

```json
{
  "kind": "meeting",
  "client": "seattle",
  "eventId": 6814,
  "body": "Select Committee on the Comprehensive Plan",
  "date": "2026-08-05T00:00:00",
  "time": "9:30 AM",
  "location": "Council Chamber, City Hall\r\n600 4th Avenue\r\nSeattle, WA 98104",
  "agendaStatus": "Final",
  "agendaFile": "https://legistar2.granicus.com/seattle/meetings/.../Agenda.pdf",
  "url": "https://seattle.legistar.com/MeetingDetail.aspx?..."
}
```

## How it works

Direct calls to each city's own Legistar Web API — no scraping, no proxy,
no key:

- Matters (legislation): `webapi.legistar.com/v1/{client}/matters`
- Events (meetings): `webapi.legistar.com/v1/{client}/events`

Both are OData endpoints with server-side date filtering
(`MatterIntroDate ge datetime'...'`), so this actor only pulls what's
actually newer than `sinceDate`/today rather than filtering client-side
after downloading everything.

## Pricing note

Billed per **city queried**, not per matter or meeting returned — a city
with 50 new ordinances this month costs the same as one with 2.

## Related products

- [Federal Register Tracker](https://github.com/timmKal01/federal-register-tracker) — the federal-level equivalent: new proposed/final rules and comment deadlines
- [Disaster Declaration Tracker](https://github.com/timmKal01/disaster-declaration-tracker) — another civic/government data source, for FEMA disaster declarations instead of council actions
