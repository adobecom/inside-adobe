import { getConfig, loadStyle } from '../../scripts/ak.js';
import { getEdition, inEdition } from '../../scripts/utils/edition.js';
import { el, listingShell, tagFilters } from '../../scripts/utils/listing.js';
import { decorateEvent } from '../event/event.js';

// The events calendar, as on the intranet: upcoming events (or those on a chosen date or range),
// filtered by category, type and location (Global and the reader's region to start with),
// soonest first, 15 at a time, each shown as its event card. Beside them: the reader's holidays
// this year and the authored Other Calendars links. Filter lists: the /calendar-filters sheet.
const INDEX = '/events/query-index.json';
const FILTERS = '/calendar-filters.json?sheet=categories&sheet=types&sheet=locations';
const PAGE = 15;
const GROUPS = [['categories', 'Event Category'], ['types', 'Event Type'], ['locations', 'Locations']];
const HOLIDAYS = 'Office Closure & Holidays';

const iso = (date) => date.toLocaleDateString('en-CA');
const day = (value) => new Date(`${value.slice(0, 10)}T12:00:00`);
const short = (value, year) => day(value).toLocaleDateString('en-US', {
  month: 'short', day: '2-digit', ...(year && { year: 'numeric' }),
});
const geoTags = (row) => (row.geography || '').split(',').map((t) => t.trim()).filter(Boolean);

// a month grid: one click picks a day, a second later day makes a range
function datePicker(onPick) {
  const details = el('details');
  const grid = el('div', 'events-calendar-month');
  details.append(el('summary', '', 'Date'), grid);
  let month = new Date();
  month.setDate(1);
  let range = {};
  const draw = () => {
    const title = el(
      'p',
      'events-calendar-month-title',
      month.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    );
    const nav = (label, step) => {
      const button = el('button', `events-calendar-${label.toLowerCase()}`);
      button.type = 'button';
      button.ariaLabel = label;
      button.addEventListener('click', () => {
        month = new Date(month.getFullYear(), month.getMonth() + step, 1);
        draw();
      });
      return button;
    };
    const days = el('div', 'events-calendar-days');
    ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].forEach((d) => days.append(el('span', '', d)));
    const first = month.getDay();
    for (let i = 0; i < first; i += 1) days.append(el('span'));
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const { from, to = from } = range;
    for (let d = 1; d <= last; d += 1) {
      const value = iso(new Date(month.getFullYear(), month.getMonth(), d));
      const button = el('button', '', String(d));
      button.type = 'button';
      button.value = value;
      button.ariaLabel = short(value, true);
      button.ariaPressed = String(!!from && value >= from && value <= to);
      if (value === iso(new Date())) button.classList.add('is-today');
      days.append(button);
    }
    days.addEventListener('click', ({ target }) => {
      const { value } = target.closest('button') || {};
      if (!value) return;
      range = from && !range.to && value > from ? { from, to: value } : { from: value };
      draw();
      onPick(range);
    });
    grid.replaceChildren(nav('Previous', -1), title, nav('Next', 1), days);
  };
  draw();
  return {
    details,
    set(value) {
      range = value;
      draw();
    },
  };
}

function planning(rows, events) {
  const section = el('div', 'events-calendar-planning');
  section.append(el('h2', '', 'Planning Calendars'));
  const { holidays, other } = rows;
  const year = new Date().getFullYear();
  const mine = el('details');
  // open beside the events; closed above them on phones
  mine.open = window.matchMedia('(width >= 900px)').matches;
  const summary = el('summary', '', `My ${year} Holidays`);
  mine.append(summary);
  const download = holidays?.querySelector('a');
  if (download) {
    download.className = 'events-calendar-download';
    download.ariaLabel = download.textContent.trim();
    download.title = download.textContent.trim();
    download.target = '_blank';
    mine.append(download);
  }
  const list = el('ul', 'events-calendar-holidays');
  mine.append(list);
  const render = () => {
    list.replaceChildren(...events
      .filter((row) => (row.type || '').includes(HOLIDAYS) && row.start.startsWith(String(year)))
      .filter((row) => inEdition(geoTags(row), getEdition()))
      .map((row) => {
        const li = el('li');
        const link = el('a', '', row.title);
        link.href = row.path;
        li.append(el('span', '', short(row.start)), link);
        return li;
      }));
  };
  render();
  section.append(mine);
  if (other) {
    const more = el('details');
    more.append(el('summary', '', 'Other Calendars'), ...other.childNodes);
    section.append(more);
  }
  return { section, render };
}

export default async function init(block) {
  loadStyle(`${getConfig().codeBase}/blocks/event/event.css`);
  // authored rows: heading, Holidays | download link, Other Calendars | links, extras
  const rows = {};
  [...block.children].slice(1).forEach((row) => {
    const [key, value] = row.children;
    const name = value && key.textContent.trim().toLowerCase();
    if (name === 'holidays' || name === 'other calendars') {
      rows[name === 'holidays' ? 'holidays' : 'other'] = value;
      row.remove();
    }
  });
  const [index, sheets] = await Promise.all([INDEX, FILTERS].map((url) => fetch(url)
    .then((r) => (r.ok ? r.json() : null)).catch(() => null)));
  if (!index) throw new Error('events index unavailable');

  let shown = PAGE;
  let range = {};
  let render;
  const changed = () => {
    shown = PAGE;
    render();
  };
  const groups = GROUPS.map(([sheet, heading]) => [heading, sheets?.[sheet]?.data || []]);
  const filters = tagFilters(groups, changed);
  // a link such as /calendar?tagValue=event:key-company-dates adds that filter
  const tagValue = new URL(window.location.href).searchParams.get('tagValue');
  if (tagValue) filters.add(tagValue);
  const picker = datePicker((value) => {
    range = value;
    changed();
  });
  const events = index.data
    .filter((row) => row.start)
    .map((row) => {
      const labels = (row.type || '').split('|');
      const all = [
        ...labels.map((label) => filters.tagFor('event', label)),
        ...labels.map((label) => filters.tagFor('eventType', label)),
        ...geoTags(row).map((g) => `geography:${g}`),
      ];
      return { ...row, all: all.filter(Boolean) };
    })
    .sort((a, b) => a.start.localeCompare(b.start));

  const {
    side, filters: panel, reset, chips, items, count, more,
  } = listingShell(block, [picker.details, ...filters.panels]);
  items.classList.add('events-calendar-items');
  const plan = planning(rows, events);
  panel.after(plan.section);

  // each card is the event's own block, fetched once
  const cards = new Map();
  const card = (row, shownDay) => {
    const li = el('li');
    const key = `${row.path}|${shownDay}`;
    if (!cards.has(key)) {
      cards.set(key, fetch(`${row.path}.plain.html`).then((r) => r.text()).then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const event = doc.querySelector('.event');
        if (!event) return null;
        decorateEvent(event, {
          start: row.start,
          end: row.end,
          tz: row.timezone,
          url: new URL(row.path, window.location.href).href,
          day: shownDay,
        });
        // a listing heading, linked to the event page
        const title = event.querySelector('.event-title :is(h1, h2)');
        if (title) {
          const h2 = el('h2');
          const link = el('a', '', title.textContent);
          link.href = row.path;
          h2.append(link);
          title.replaceWith(h2);
        }
        return event;
      }).catch(() => null));
    }
    cards.get(key).then((event) => {
      if (event) li.replaceChildren(event);
      else li.remove();
    });
    return li;
  };

  render = () => {
    const today = iso(new Date());
    const from = range.from || today;
    const to = range.to || range.from;
    const dateChip = range.from && el(
      'button',
      'tag-filters-chip',
      to !== from ? `${short(from)} – ${short(to, true)}` : short(from, true),
    );
    if (dateChip) {
      dateChip.type = 'button';
      dateChip.ariaLabel = `Remove ${dateChip.textContent}`;
      dateChip.addEventListener('click', () => {
        range = {};
        picker.set(range);
        changed();
      });
    }
    chips.replaceChildren(...[dateChip, ...filters.chips()].filter(Boolean));
    const matches = events.filter((row) => {
      const end = (row.end || row.start).slice(0, 10);
      const start = row.start.slice(0, 10);
      return end >= from && (!to || start <= to) && filters.matches(row.all);
    });
    // a running multi-day event shows the first day in view
    items.replaceChildren(...matches.slice(0, shown)
      .map((row) => card(row, row.start.slice(0, 10) < from ? from : row.start)));
    count.textContent = `Displaying ${Math.min(shown, matches.length)} of ${matches.length}`;
    more.hidden = shown >= matches.length;
    more.textContent = 'Load more events';
  };

  reset.addEventListener('click', () => {
    filters.reset();
    range = {};
    picker.set(range);
    changed();
  });
  more.addEventListener('click', () => {
    shown += PAGE;
    render();
  });
  window.addEventListener('edition-change', () => {
    filters.resetLocations();
    plan.render();
    changed();
  });
  side.classList.add('events-calendar-aside');
  render();
}
