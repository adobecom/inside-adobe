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
  start, end, tz, title, where, details, url,
}) {
  const now = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Inside Adobe//Events//EN', 'BEGIN:VEVENT',
    `UID:${new URL(url).pathname}@inside-adobe`, `DTSTAMP:${now}`,
    `DTSTART${icsValue(start, tz)}`, `DTEND${icsValue(end || start, tz, !start.includes('T'))}`,
    `SUMMARY:${icsText(title)}`, where && `LOCATION:${icsText(where)}`,
    `URL:${url}`, details && `DESCRIPTION:${icsText(details)}`,
    'END:VEVENT', 'END:VCALENDAR',
  ].filter(Boolean);
  const a = document.createElement('a');
  a.className = 'btn btn-outline event-calendar';
  a.textContent = 'Add to Calendar';
  a.href = URL.createObjectURL(new Blob([lines.join('\r\n')], { type: 'text/calendar' }));
  a.download = `${new URL(url).pathname.split('/').pop() || 'event'}.ics`;
  return a;
}

// the day shown: the start, or a later day the listing is showing (a running multi-day event)
function chip(start, end, day = start) {
  const date = new Date(`${day.slice(0, 10)}T12:00:00Z`);
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

function copyButton(url) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'event-copy';
  button.setAttribute('aria-label', 'Copy link to this event');
  button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(url);
    button.classList.add('is-copied');
    setTimeout(() => button.classList.remove('is-copied'), 2000);
  });
  return button;
}

// a registration link replaces Add to Calendar, as on the intranet
function registerButton(link) {
  const a = document.createElement('a');
  a.className = 'btn btn-outline event-calendar';
  a.textContent = 'Register';
  a.href = link.href;
  a.target = '_blank';
  return a;
}

/**
 * The event card, for an event page or a calendar listing
 * @param {Object} event start, end, tz as in the page metadata; url of the event page;
 * day: the date the chip shows (default the start)
 */
export function decorateEvent(el, {
  start, end, tz, url = window.location.href, day,
}) {
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

  const head = document.createElement('div');
  head.className = 'event-head';
  if (start) head.append(chip(start, end, day));
  head.append(copyButton(url));
  const register = [...(cells.link?.querySelectorAll('a') || [])]
    .find((a) => a.textContent.toLowerCase().includes('register'));
  if (register) head.append(registerButton(register));
  else if (start) {
    head.append(calendarLink({
      start,
      end,
      tz,
      url,
      title: cells.title?.textContent.trim() || document.title,
      where: cells.where?.textContent.trim(),
      details: cells.details?.textContent.trim(),
    }));
  }
  el.replaceChildren(head, body);
}

export default function init(el) {
  decorateEvent(el, {
    start: getMetadata('event-start'),
    end: getMetadata('event-end'),
    tz: getMetadata('event-time-zone'),
  });
}
