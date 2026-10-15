import { getEdition, inEdition } from '../../scripts/utils/edition.js';

// The next events for the reader's edition, from the events index; the authored rows are the
// fallback when the index can't be loaded. Updates when the edition changes.
const INDEX = '/events/query-index.json';
const LIMIT = 3;

function span(className, text) {
  const el = document.createElement('span');
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

function item({
  href, month, day, location, name,
}) {
  const link = document.createElement('a');
  if (href) link.href = href;
  const when = span('events-date');
  when.append(span('', month), span('', day));
  const what = span('events-info');
  what.append(span('', location), span('', name));
  link.append(when, what);
  const li = document.createElement('li');
  li.append(link);
  return li;
}

function fromRow(row) {
  const [date, location, title] = [...row.children];
  const [month, day] = date.textContent.trim().split(/\s+/);
  return {
    href: title.querySelector('a')?.getAttribute('href'),
    month,
    day,
    location: location.textContent.trim(),
    name: title.textContent.trim(),
  };
}

// upcoming (or still running) events for the edition, soonest first
function upcoming(rows, edition) {
  const today = new Date().toLocaleDateString('en-CA');
  const tags = (row) => (row.geography || '').split(',').map((t) => t.trim()).filter(Boolean);
  return rows
    .filter((row) => row.start && (row.end || row.start).slice(0, 10) >= today)
    .filter((row) => inEdition(tags(row), edition))
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, LIMIT)
    .map((row) => {
      const start = new Date(`${row.start.slice(0, 10)}T12:00:00`);
      return {
        href: row.path,
        month: start.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
        day: String(start.getDate()),
        location: row.region || 'Global',
        name: row.title,
      };
    });
}

export default async function init(el) {
  const [head, ...rows] = el.children;
  head.className = 'events-head';
  const authored = rows.map(fromRow);
  rows.forEach((row) => row.remove());
  const list = document.createElement('ul');
  el.append(list);

  const index = await fetch(INDEX).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const render = () => {
    const events = index?.data ? upcoming(index.data, getEdition()) : authored;
    list.replaceChildren(...events.map(item));
    if (!events.length) list.append(Object.assign(document.createElement('li'), { className: 'events-none', textContent: 'No upcoming events.' }));
  };
  render();
  window.addEventListener('edition-change', render);
}
