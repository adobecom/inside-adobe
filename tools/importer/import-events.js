/* eslint-disable */
/* global WebImporter */
/**
 * Import for the intranet's "Event" template (149 pages), from the local mirror.
 * Page: More Events button, then the event block (parsers/event.js), then metadata:
 *   Template: event; Event Start / Event End (YYYY-MM-DD, or YYYY-MM-DDTHH:MM when timed);
 *   Event Time Zone (IANA, when the source names one); Event Type; Event Region.
 * Start/end come from the date line, e.g. "Monday, Oct 12, 2026 | 12:00-12:30 pm PT | 3:00-3:30 pm ET"
 * or "Monday, Jun 29, 2026 to Wednesday, Jul 01, 2026".
 */
import cleanupTransformer from './transformers/inside-adobe-cleanup.js';
import eventParser from './parsers/event.js';

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const TZ = {
  PT: 'America/Los_Angeles', PST: 'America/Los_Angeles', PDT: 'America/Los_Angeles',
  MT: 'America/Denver', MST: 'America/Denver', MDT: 'America/Denver',
  CT: 'America/Chicago', CST: 'America/Chicago', CDT: 'America/Chicago',
  ET: 'America/New_York', EST: 'America/New_York', EDT: 'America/New_York',
  GMT: 'Europe/London', BST: 'Europe/London', CET: 'Europe/Paris', CEST: 'Europe/Paris',
  IST: 'Asia/Kolkata', JST: 'Asia/Tokyo', SGT: 'Asia/Singapore', AEDT: 'Australia/Sydney', AEST: 'Australia/Sydney',
};
const pad = (n) => String(n).padStart(2, '0');

export function parseWhen(text) {
  const dates = [...text.matchAll(/\b([A-Z][a-z]{2})[a-z]*\.? (\d{1,2}), (\d{4})/g)]
    .map(([, m, d, y]) => `${y}-${pad(MONTHS[m.toLowerCase()])}-${pad(d)}`);
  if (!dates.length) return {};
  const t = (text.split('|')[1] || '')
    .match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[-–]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\s*([A-Z]{2,4})?/i);
  if (!t) return { start: dates[0], end: dates[dates.length - 1] };
  const [, sh, sm, sap, eh, em, eap, zone] = t;
  const hour = (h, ap) => (Number(h) % 12) + (ap.toLowerCase() === 'pm' ? 12 : 0);
  let start = hour(sh, sap || eap);
  const end = hour(eh, eap);
  if (!sap && start > end) start -= 12; // "11-12pm" starts at 11am
  return {
    start: `${dates[0]}T${pad(start)}:${sm || '00'}`,
    end: `${dates[0]}T${pad(end)}:${em || '00'}`,
    tz: zone && TZ[zone.toUpperCase()],
  };
}

export default {
  transform: (payload) => {
    const { document, params } = payload;
    const main = document.body;
    const source = new URL(params.originalURL);
    const path = source.pathname.replace(/^\/content\/inside\/en(?=[/.])/, '').replace(/\.html$/, '');

    const content = document.querySelector('.event-content-container');
    const when = parseWhen(content?.querySelector('.event-list-item-date')?.textContent.replace(/\s+/g, ' ').trim() || '');
    const type = content?.querySelector('.event-type')?.textContent.trim();
    const region = [...(content?.querySelectorAll('.geo-tag-item') || [])].map((g) => g.textContent.trim()).join(', ');
    const more = content?.querySelector('.view-more-btn a');

    cleanupTransformer('beforeTransform', main, payload);
    const block = document.querySelector('.event-content-container');
    if (block) {
      const out = [];
      if (more) {
        const p = document.createElement('p');
        const strong = document.createElement('strong');
        const a = document.createElement('a');
        a.href = more.getAttribute('href');
        a.textContent = more.textContent.trim();
        strong.append(a);
        p.append(strong);
        out.push(p, document.createElement('hr'));
      }
      const holder = document.createElement('div');
      out.push(holder);
      block.closest('.eventcontent')?.replaceWith(...out);
      holder.append(block);
      eventParser(block, { document });
      holder.replaceWith(...holder.childNodes);
    }
    cleanupTransformer('afterTransform', main, payload);

    // intranet page links → site paths; documents stay on the intranet for now
    main.querySelectorAll('a[href]').forEach((a) => {
      let url;
      try { url = new URL(a.getAttribute('href'), 'https://inside.corp.adobe.com'); } catch { return; }
      if (!/^(inside\.corp\.adobe\.com|127\.0\.0\.1(:\d+)?)$/.test(url.host) || a.getAttribute('href').startsWith('#')) return;
      if (url.pathname.startsWith('/content/dam/')) { a.href = `https://inside.corp.adobe.com${url.pathname}`; return; }
      a.href = `${url.pathname.replace(/^\/content\/inside\/en(?=[/.])/, '').replace(/\.html$/, '') || '/'}${url.search}${url.hash}`;
    });

    main.append(document.createElement('hr'));
    main.append(WebImporter.Blocks.getMetadataBlock(document, {
      Title: document.title,
      Template: 'event',
      ...(when.start && { 'Event Start': when.start, 'Event End': when.end }),
      ...(when.tz && { 'Event Time Zone': when.tz }),
      ...(type && { 'Event Type': type }),
      ...(region && { 'Event Region': region }),
    }));
    WebImporter.rules.adjustImageUrls(main, payload.url, params.originalURL);
    return [{ element: main, path, report: { title: document.title, start: when.start || '' } }];
  },
};
