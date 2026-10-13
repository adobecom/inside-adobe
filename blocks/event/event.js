import { getMetadata } from '../../scripts/ak.js';

const ICON = { when: 'clock', where: 'location', link: 'link' };
const ORDER = ['type', 'region', 'title', 'when', 'where', 'link', 'details'];

// "2026-10-12" or "2026-10-12T12:00" → ICS value; all-day ends are exclusive (next day)
function icsValue(value, tz, nextDay) {
  const [date, time] = value.split('T');
  if (!time) {
    const d = new Date(`${date}T12:00:00Z`);
    if (nextDay) d.setUTCDate(d.getUTCDate() + 1);
    return `;VALUE=DATE:${d.toISOString().slice(0, 10).replaceAll('-', '')}`;
  }
  const stamp = `${date.replaceAll('-', '')}T${time.replace(':', '')}00`;
  return tz ? `;TZID=${tz}:${stamp}` : `:${stamp}`;
}

const icsText = (s) => s.replace(/\\/g, '\\\\').replace(/[,;]/g, '\\$&').replace(/\n/g, '\\n');

function calendarLink({
  start, end, tz, title, where, details,
}) {
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Inside Adobe//Events//EN', 'BEGIN:VEVENT',
    `UID:${window.location.pathname}@inside-adobe`, `DTSTAMP:${now}`,
    `DTSTART${icsValue(start, tz)}`, `DTEND${icsValue(end || start, tz, !start.includes('T'))}`,
    `SUMMARY:${icsText(title)}`, where && `LOCATION:${icsText(where)}`,
    `URL:${window.location.href}`, details && `DESCRIPTION:${icsText(details)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean);
  const a = document.createElement('a');
  a.className = 'btn btn-outline event-calendar';
  a.textContent = 'Add to Calendar';
  a.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
  a.download = `${window.location.pathname.split('/').pop() || 'event'}.ics`;
  return a;
}

function chip(start, end) {
  const date = new Date(`${start.slice(0, 10)}T12:00:00Z`);
  const el = document.createElement('p');
  el.className = 'event-chip';
  el.innerHTML = '<span></span><span></span>';
  el.children[0].textContent = date.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' });
  el.children[1].textContent = String(date.getUTCDate()).padStart(2, '0');
  if (end && end.slice(0, 10) !== start.slice(0, 10)) {
    el.append(Object.assign(document.createElement('span'), { textContent: 'Multi Day' }));
  }
  return el;
}

function copyButton() {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'event-copy';
  button.setAttribute('aria-label', 'Copy link to this event');
  button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(window.location.href);
    button.classList.add('is-copied');
    setTimeout(() => button.classList.remove('is-copied'), 2000);
  });
  return button;
}

export default function init(el) {
  const cells = Object.fromEntries([...el.children].map((row) => {
    const [key, value] = row.children;
    return [key?.textContent.trim().toLowerCase(), value];
  }));
  const body = document.createElement('div');
  body.className = 'event-body';
  ORDER.filter((k) => cells[k]).forEach((k) => {
    cells[k].className = `event-${k}${ICON[k] ? ` event-icon event-icon-${ICON[k]}` : ''}`;
    body.append(cells[k]);
  });

  const start = getMetadata('event-start');
  const head = document.createElement('div');
  head.className = 'event-head';
  if (start) head.append(chip(start, getMetadata('event-end')));
  head.append(copyButton());
  if (start) {
    head.append(calendarLink({
      start,
      end: getMetadata('event-end'),
      tz: getMetadata('event-time-zone'),
      title: cells.title?.textContent.trim() || document.title,
      where: cells.where?.textContent.trim(),
      details: cells.details?.textContent.trim(),
    }));
  }
  el.replaceChildren(head, body);
}
