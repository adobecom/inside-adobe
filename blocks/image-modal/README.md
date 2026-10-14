# image-modal

A row of image tiles (image, title, caption over a dark gradient). Clicking a tile opens a pop-up
with the title and caption, the image and more content, as on the intranet. Three tiles per row
from 768px, one per row on phones. The pop-up closes with its × button, Escape, or a click outside it.

## Authoring (Document Authoring)

Model: `standalone`

One row per tile, three cells: the image | the title, then the caption (e.g. dates) as a second
paragraph | the pop-up content (any text, lists, links).

Put the image cell last to show the image on the right of the content in the pop-up.

## Supported variations

- `center`: center the tiles in the row (for rows with fewer than three tiles).
