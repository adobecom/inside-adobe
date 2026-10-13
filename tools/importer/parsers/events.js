/* eslint-disable */
/* global WebImporter */
/**
 * Parser for events: snapshot of the events list.
 *   row 1: "Events" heading | More Events link (primary button)
 *   then one row per event: date ("OCT 12") | location | title linked to the event
 */
export default function parse(element, { document }) {
  const heading = document.createElement('h2');
  heading.textContent = element.querySelector('.events-title-section h2')?.textContent.trim() || 'Events';
  const head = [heading];
  const more = element.querySelector('.events-title-section a');
  if (more) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    const a = document.createElement('a');
    a.href = more.getAttribute('href');
    a.textContent = more.textContent.trim();
    strong.append(a);
    p.append(strong);
    head.push(p);
  }

  const cells = [head];
  element.querySelectorAll('.events-list-item').forEach((item) => {
    const text = (sel) => item.querySelector(sel)?.textContent.trim() || '';
    const link = document.createElement('a');
    link.href = item.querySelector('a')?.getAttribute('href') || '';
    link.textContent = text('.list-title');
    cells.push([`${text('.event-month')} ${text('.event-date')}`, text('.list-location'), link]);
  });
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'events', cells }));
}
