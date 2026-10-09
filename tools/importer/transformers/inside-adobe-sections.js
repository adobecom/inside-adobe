/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Inside Adobe section breaks + Section Metadata.
 * Uses payload.template.sections (selectors verified in migration-work/cleaned.html).
 * Breaks are inserted in beforeTransform while every section element still exists;
 * Section Metadata is added in afterTransform, anchored to a marker <hr>.
 */
const SECTION_MARKER_ATTR = 'data-excat-section-id';

// Author Kit reads layout from section-metadata keys (grid: 2 -> .grid.grid-2),
// so map "grid-N" / "gap-X" / "spacing-X" style tokens onto those keys.
const LAYOUT_KEYS = ['grid', 'gap', 'spacing', 'container'];

function toSectionMetadata(style) {
  const cells = {};
  const rest = [];
  style.split(',').map((s) => s.trim()).filter(Boolean).forEach((token) => {
    const key = LAYOUT_KEYS.find((k) => token.startsWith(`${k}-`));
    if (key) cells[key] = token.slice(key.length + 1);
    else if (token !== 'grid') rest.push(token);
  });
  if (rest.length) cells.style = rest.join(', ');
  return cells;
}

function querySection(root, selectors) {
  for (const sel of selectors || []) {
    const el = root.querySelector(sel);
    if (el) return el;
  }
  return null;
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  const doc = element.ownerDocument;

  if (hookName === 'beforeTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (i === 0 && !section.style) continue;
      const sectionEl = querySection(element, section.selector);
      if (!sectionEl) continue;

      const hr = doc.createElement('hr');
      if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
      sectionEl.before(hr);
    }
  }

  if (hookName === 'afterTransform') {
    for (let i = sections.length - 1; i >= 0; i -= 1) {
      const section = sections[i];
      if (!section.style) continue;

      const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
      const anchor = marker || querySection(element, section.selector);
      if (!anchor) continue;

      const metadataBlock = WebImporter.Blocks.createBlock(doc, {
        name: 'Section Metadata',
        cells: toSectionMetadata(section.style),
      });
      anchor.after(metadataBlock);

      if (marker) {
        marker.removeAttribute(SECTION_MARKER_ATTR);
        if (i === 0) marker.remove();
      }
    }
  }
}
