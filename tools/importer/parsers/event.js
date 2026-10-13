/* eslint-disable */
/* global WebImporter */
/**
 * Parser for event: the intranet's .eventcontent (one per event page).
 * Key/value rows (first cell the label, second the content), in display order:
 *   Type | Region | Title (H1) | When | Where | Link | Details
 * Empty fields are left out. The date chip and "Add to Calendar" come from page metadata
 * (Event Start / Event End / Event Time Zone), set by the import script.
 */
export default function parse(element, { document }) {
  const text = (sel) => element.querySelector(sel)?.textContent.replace(/\s+/g, ' ').trim() || '';
  const rows = [];
  const add = (label, value) => { if (value && (typeof value !== 'string' || value)) rows.push([label, value]); };

  add('Type', text('.event-type'));
  add('Region', [...element.querySelectorAll('.geo-tag-item')].map((g) => g.textContent.trim()).filter(Boolean).join(', '));
  const title = text('.event-list-item-title');
  if (title) {
    const h1 = document.createElement('h1');
    h1.textContent = title;
    add('Title', h1);
  }
  add('When', text('.event-list-item-date'));
  add('Where', text('.event-list-item-location'));
  const link = element.querySelector('.event-list-item-link a');
  if (link) {
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    a.textContent = link.textContent.trim();
    add('Link', a);
  }
  const details = element.querySelector('.event-list-item-text');
  if (details && details.textContent.trim()) add('Details', [...details.children]);

  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'event', cells: rows }));
}
