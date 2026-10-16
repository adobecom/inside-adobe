import { expect } from '@esm-bundle/chai';
import init from '../../blocks/events/events.js';
import { DEFAULT_EDITION, setEdition } from '../../scripts/utils/edition.js';

const day = (offset) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-CA');
};
const event = (path, title, start, end, region, geography, type = 'Benefits & Wellbeing | virtual') => ({
  path, title, start, end, region, geography, type,
});
const INDEX = {
  data: [
    event('/events/past', 'Past', day(-3), day(-3), 'Global', 'global'),
    event('/events/global', 'Global day', day(2), day(2), 'Global', 'global'),
    event('/events/us', 'US benefits fair', `${day(1)}T09:00`, `${day(1)}T10:00`, 'United States', 'global/americas/united-states'),
    event('/events/seattle', 'Seattle meetup', day(0), day(0), 'Seattle', 'global/americas/united-states/seattle'),
    event('/events/running', 'Week of learning', day(-1), day(4), '', ''),
    event('/events/later', 'Later', day(9), day(9), 'Global', 'global'),
    event('/events/observance', 'Observance', day(1), day(1), 'Global', 'global', 'Cultural Moments & Observances'),
  ],
};

const block = () => {
  const el = document.createElement('div');
  el.innerHTML = `<div><div><h2>Events</h2></div><div><p><strong><a href="/calendar">More Events</a></strong></p></div></div>
    <div><div>OCT 12</div><div>Americas</div><div><a href="/events/authored">Authored event</a></div></div>`;
  document.body.append(el);
  // test files share storage when run in parallel: don't rely on the default edition
  setEdition(DEFAULT_EDITION);
  return el;
};
const titles = (el) => [...el.querySelectorAll('li a .events-info span:last-child')].map((s) => s.textContent);

describe('events', () => {
  const { fetch } = window;
  afterEach(() => {
    window.fetch = fetch;
    localStorage.removeItem('edition');
  });

  it('lists the next three events for the edition, soonest first', async () => {
    window.fetch = async () => new Response(JSON.stringify(INDEX));
    const el = block();
    await init(el);
    // United States by default: no past, already running, observance or Seattle-only events
    expect(titles(el)).to.deep.equal(['US benefits fair', 'Global day', 'Later']);
    expect(el.querySelector('li a').getAttribute('href')).to.equal('/events/us');
    expect(el.querySelectorAll('li a .events-info span')[0].textContent).to.equal('United States');
    el.remove();
  });

  it('updates when the edition changes', async () => {
    window.fetch = async () => new Response(JSON.stringify(INDEX));
    const el = block();
    await init(el);
    setEdition({ name: 'Paris', geo: 'global/emea/france/paris', manager: false });
    expect(titles(el)).to.deep.equal(['Global day', 'Later']);
    setEdition({ name: 'Seattle', geo: 'global/americas/united-states/seattle', manager: false });
    expect(titles(el)).to.deep.equal(['Seattle meetup', 'US benefits fair', 'Global day']);
    el.remove();
  });

  it('narrows to a category, a location and a limit when authored', async () => {
    window.fetch = async () => new Response(JSON.stringify(INDEX));
    const el = block();
    el.insertAdjacentHTML('beforeend', '<div><div>Category</div><div>Benefits &amp; Wellbeing</div></div><div><div>Limit</div><div>1</div></div>');
    await init(el);
    expect(titles(el)).to.deep.equal(['US benefits fair']);
    el.remove();

    const office = block();
    office.insertAdjacentHTML('beforeend', '<div><div>Location</div><div>global/americas/united-states/seattle</div></div>');
    await init(office);
    // the place's events whatever the reader's edition; nothing Global or country-wide
    expect(titles(office)).to.deep.equal(['Seattle meetup']);
    office.remove();
  });

  it('keeps the authored events when the index is unavailable', async () => {
    window.fetch = async () => new Response('', { status: 404 });
    const el = block();
    await init(el);
    expect(titles(el)).to.deep.equal(['Authored event']);
    expect(el.querySelector('.events-head')).to.exist;
    el.remove();
  });
});
