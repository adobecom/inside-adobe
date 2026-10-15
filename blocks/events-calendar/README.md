# events-calendar

The events calendar on `/calendar`, as on the intranet: upcoming events soonest first, 15 at a
time with **Load more events**, each shown as its event card (date chip, copy link, Add to Calendar
or Register, type, location, title, when, where, details). A multi-day event that's already
running shows today's date.

Filters: **Date** (a month grid: pick a day, then a later day for a range), **Event Category**,
**Event Type** and **Locations**. The listing starts with **Global** and the reader's region (from
the header's edition picker); **Reset Filters** goes back to that. Beside the filters,
**Planning Calendars**: the reader's holidays this year (Office Closure & Holidays events for
their edition) and the authored Other Calendars links.

## Authoring (Document Authoring)

Model: `standalone`

- Row 1: the heading (`Events Calendar`, H1).
- `Holidays` | a link to the full holiday calendar (the download icon next to My Holidays).
- `Other Calendars` | a list of links.
- Further rows: shown under the filters from 900px, e.g. a link to the shared submit boxes
  (`/fragments/shared/calendar-feedback`).

Events come from `/events/query-index.json` (the `events` index in `helix-query.yaml`): each event
page's `Event Start`, `Event End`, `Event Time Zone`, `Event Type` (category and type labels, e.g.
`Benefits & Wellbeing | virtual`) and `Geography`. The filter lists are the `/calendar-filters`
sheet (sheets `categories`, `types`, `locations`; columns `Name`, `Tag`); an event's type labels
match the names there.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
