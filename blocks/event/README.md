# event

An event page's details: date chip, copy-link button, Add to Calendar, and the event's fields.
Use it on pages with page metadata `Template` set to `event` (More Events button top right).

## Authoring (Document Authoring)

Model: `standalone`

One row per field, label in the first cell (rows can be left out):

| event | |
| --- | --- |
| Type | Benefits & Wellbeing \| virtual |
| Region | Americas |
| Title | the event name, as Heading 1 |
| When | Monday, Oct 12, 2026 \| 12:00-12:30 pm PT \| 3:00-3:30 pm ET |
| Where | Virtual Event |
| Link | a link, e.g. [Join on Zoom](…) |
| Details | the description |

Page metadata drives the date chip and the calendar file, so keep it in step with **When**:

- `Event Start`: `2026-10-12` (all day) or `2026-10-12T12:00` (timed)
- `Event End`: same format; a later date shows "Multi Day"
- `Event Time Zone`: for timed events, e.g. `America/Los_Angeles` (left out: the viewer's local time)

`Event Type` and `Event Region` metadata repeat the block's values for listings.

## Supported variations

No variations.
