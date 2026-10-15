# events

Upcoming events list with a heading and a **More Events** button: the next three events for the
reader's edition (the header's edition picker; United States by default), soonest first. Events
still running count as upcoming. Changing the edition updates the list in place.

## Authoring (Document Authoring)

Model: `standalone`

- Row 1: the heading (`Events`) | a **bold** link to the calendar (renders as a button).
- Optional rows, one per event: date as `OCT 12` | location | event title, linked to the event
  page. They're only shown when the events index can't be loaded.

The list comes from `/events/query-index.json` (the `events` index in `helix-query.yaml`): each
event page's `Event Start`, `Event End`, `Event Region` (shown as the location) and `Geography`
metadata. An event is for the edition when one of its `Geography` tags is the edition's geography
or contains it; `global`, or no `Geography`, is for everyone.

## Supported variations

No variations.

## Universal Editor fields

N/A (Document Authoring project)
