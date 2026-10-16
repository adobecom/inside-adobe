import { getEdition, inEdition } from '../../scripts/utils/edition.js';

// The next events for the reader's edition, from the events index; the authored rows are the
// fallback when the index can't be loaded. Updates when the edition changes. Optional rows narrow
// it, as the intranet's embedded event lists did: Category (an event type label), Location (a
// geography tag: that place's events, whatever the edition) and Limit.
const INDEX = '/events/query-index.json';
const LIMIT = 3;
// all-day observances would crowd out sessions; the intranet's homepage list leaves them out
const SKIP_TYPE = 'Cultural Moments & Observances';
const OPTIONS = ['category', 'location', 'limit'];

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

// events starting today or later for the edition (or the location), soonest first (as on the
// intranet: an observance that started last month isn't listed)
function upcoming(rows, edition, { category, location, limit }) {
  const today = new Date().toLocaleDateString('en-CA');
  const tags = (row) => (row.geography || '').split(',').map((t) => t.trim()).filter(Boolean);
  const labels = (row) => (row.type || '').split('|').map((t) => t.trim().toLowerCase());
  const here = (row) => tags(row).some((tag) => tag === location || tag.startsWith(`${location}/`));
  return rows
    .filter((row) => row.start && row.start.slice(0, 10) >= today)
    .filter((row) => (location ? here(row) : inEdition(tags(row), edition)))
    .filter((row) => (category
      ? labels(row).includes(category.toLowerCase()) : !(row.type || '').includes(SKIP_TYPE)))
    .sort((a, b) => a.start.localeCompare(b.start))
    .slice(0, Number(limit) || LIMIT)
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
  const options = {};
  const events = rows.filter((row) => {
    const key = row.children[0]?.textContent.trim().toLowerCase();
    if (row.children.length !== 2 || !OPTIONS.includes(key)) return true;
    options[key] = row.children[1].textContent.trim();
    return false;
  });
  const authored = events.map(fromRow);
  rows.forEach((row) => row.remove());
  const list = document.createElement('ul');
  el.append(list);

  const index = await fetch(INDEX).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const render = () => {
    const shown = index?.data ? upcoming(index.data, getEdition(), options) : authored;
    list.replaceChildren(...shown.map(item));
    if (!shown.length) list.append(Object.assign(document.createElement('li'), { className: 'events-none', textContent: 'No upcoming events.' }));
  };
  render();
  window.addEventListener('edition-change', render);
}
