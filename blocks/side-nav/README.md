# side-nav

The section menu on pages with page metadata `Template` set to `side-nav`. You don't add this
block: the page script adds it, and `templates/side-nav/side-nav.css` places it beside the content
(above it, collapsed into a bar, on mobile).

## Authoring (Document Authoring)

One menu document per section, at `/fragments/side-nav/<name>`:

- an H2 that links to the section's landing page (the menu title)
- a bulleted list of links

A page uses the menu named after the first part of its path (`/benefits-wellbeing/...` →
`/fragments/side-nav/benefits-wellbeing`). To use another one, set page metadata `Side Nav` to a
name (`offices-san-jose`) or a path. The link to the current page (or its closest parent) is
highlighted.
