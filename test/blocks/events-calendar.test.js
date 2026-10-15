import { expect } from '@esm-bundle/chai';
import { setConfig } from '../../scripts/ak.js';
import init from '../../blocks/events-calendar/events-calendar.js';

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-CA');
};
const event = (path, start, end, type, geography) => ({
  path, title: path.split('/').pop(), start, end, type, region: '', geography, timezone: '',
});
const year = new Date().getFullYear();
const INDEX = {
  data: [
    event('/events/past', day(-5), day(-5), 'Benefits & Wellbeing | virtual', 'global'),
    event('/events/month', day(-10), day(10), 'Cultural Moments & Observances', 'global'),
    event('/events/us-fair', `${day(1)}T09:00`, `${day(1)}T10:00`, 'Benefits & Wellbeing | in-person', 'global/americas/united-states'),
    event('/events/london', day(2), day(2), 'Site Specific | in-person', 'global/emea/united-kingdom/london'),
    event('/events/later', day(20), day(20), 'Learning & Growth | virtual', 'global'),
    event('/events/new-year', `${year}-01-01`, `${year}-01-01`, 'Office Closure & Holidays', 'global/americas/united-states'),
    event('/events/canada-day', `${year}-07-01`, `${year}-07-01`, 'Office Closure & Holidays', 'global/americas/canada'),
  ],
};
const sheet = (rows) => ({ data: rows.map(([Name, Tag]) => ({ Name, Tag })) });
const FILTERS = {
  categories: sheet([['Benefits & Wellbeing', 'event:benefits'], ['Learning & Growth', 'event:learning-&-growth'],
    ['Office Closure & Holidays', 'event:holidays']]),
  types: sheet([['In-Person', 'eventType:in-person'], ['Virtual', 'eventType:virtual']]),
  locations: sheet([['Global', 'geography:global'], ['Americas', 'geography:global/americas'],
    ['EMEA', 'geography:global/emea']]),
};
const card = (path) => `<div><div class="event"><div><div>Title</div><div><h1>${path.split('/').pop()}</h1></div></div>
  <div><div>Link</div><div>${path.includes('fair') ? '<a href="https://example.com/r">Register now</a>' : ''}</div></div></div></div>`;

const settle = () => new Promise((r) => { setTimeout(r, 50); });
const block = async () => {
  const el = document.createElement('div');
  el.className = 'events-calendar';
  el.innerHTML = `<div><div><h1>Events Calendar</h1></div></div>
    <div><div>Holidays</div><div><p><a href="https://example.com/holidays">Download full holiday calendar</a></p></div></div>
    <div><div>Other Calendars</div><div><ul><li><a href="/calendar/key-company-dates">Key Company Dates</a></li></ul></div></div>`;
  document.body.append(el);
  await init(el);
  await settle();
  return el;
};
const titles = (el) => [...el.querySelectorAll('.events-calendar-items .event-title')].map((t) => t.textContent);

describe('events-calendar', () => {
  const { fetch } = window;
  before(() => setConfig({ hostnames: [], linkBlocks: [], codeBase: '' }));
  beforeEach(() => {
    window.fetch = async (url) => {
      const u = String(url);
      if (u.includes('query-index')) return new Response(JSON.stringify(INDEX));
      if (u.includes('calendar-filters')) return new Response(JSON.stringify(FILTERS));
      return new Response(card(u.replace('.plain.html', '')));
    };
  });
  afterEach(() => {
    window.fetch = fetch;
    document.querySelectorAll('.events-calendar').forEach((el) => el.remove());
  });

  it('lists upcoming events for Global and the reader\'s region, soonest first', async () => {
    const el = await block();
    expect(titles(el)).to.deep.equal(['month', 'us-fair', 'later']);
    expect(el.querySelector('.listing-count').textContent).to.equal('Displaying 3 of 3');
    // a running multi-day event shows today
    const chip = el.querySelector('.events-calendar-items .event-chip');
    expect(chip.children[1].textContent).to.equal(String(new Date().getDate()).padStart(2, '0'));
    expect(chip.textContent).to.contain('Multi Day');
    // a registration link replaces Add to Calendar
    const buttons = [...el.querySelectorAll('.events-calendar-items .event-calendar')].map((b) => b.textContent);
    expect(buttons).to.deep.equal(['Add to Calendar', 'Register', 'Add to Calendar']);
  });

  it('filters by category from the event\'s type labels, and by date', async () => {
    const el = await block();
    el.querySelector('input[value="event:benefits"]').click();
    await settle();
    expect(titles(el)).to.deep.equal(['us-fair']);
    el.querySelector('.listing-reset').click();
    if (day(2).slice(0, 7) !== day(0).slice(0, 7)) el.querySelector('.events-calendar-next').click();
    el.querySelector(`.events-calendar-days button[value="${day(2)}"]`).click();
    await settle();
    expect(titles(el)).to.deep.equal(['month']);
    expect(el.querySelector('.tag-filters-chip').textContent).to.contain(String(new Date(`${day(2)}T12:00`).getFullYear()));
  });

  it('lists the reader\'s holidays this year and the authored calendars', async () => {
    const el = await block();
    const holidays = [...el.querySelectorAll('.events-calendar-holidays li')].map((li) => li.textContent);
    expect(holidays).to.deep.equal(['Jan 01new-year']);
    expect(el.querySelector('.events-calendar-download').href).to.equal('https://example.com/holidays');
    expect(el.querySelector('.events-calendar-planning details:last-child a').textContent).to.equal('Key Company Dates');
  });
});
