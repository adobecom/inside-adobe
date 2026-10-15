# edition-pages

The page at a topic's own address (e.g. `/benefits-wellbeing/health-insurance`) for topics that
have a version per country or per role. It opens the reader's version, using the edition chosen in
the header's edition picker (United States by default). When no version matches (or without
JavaScript) it shows the list of versions to choose from.

## Authoring (Document Authoring)

Model: `standalone`

One row per version, two cells: a link to the version (its text is the country or role shown in
the list) | the geographies it serves, comma-separated, e.g. `global/emea/france` or
`global/americas/brazil, global/americas/mexico`. The most specific match wins, so a city edition
(`global/emea/france/paris`) opens the France version.

For topics with a manager version, put `manager` in that row's second cell and `employee` in the
other's; the picker's "I'm a people manager" option chooses between them.

Add `?versions` to the page address to see the list without being sent on (for checking).

The picker's locations and the list of these topics are in the `/editions` sheet (`locations`:
Name, Group `office`/`remote`, Geography; `topics`: Topic, Kind).

## Supported variations

No variations.
