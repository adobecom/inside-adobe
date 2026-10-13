import { expect } from '@esm-bundle/chai';
import init from '../../blocks/event/event.js';

describe('event', () => {
  const metas = [];
  const setMeta = (name, content) => {
    const meta = document.createElement('meta');
    meta.name = name;
    meta.content = content;
    document.head.append(meta);
    metas.push(meta);
  };
  const block = () => {
    const el = document.createElement('div');
    el.innerHTML = '<div><div>Title</div><div><h1>Summit; part 1</h1></div></div><div><div>Where</div><div>San Jose</div></div>';
    init(el);
    return el;
  };
  const ics = async (el) => (await fetch(el.querySelector('.event-calendar').href)).text();

  afterEach(() => metas.splice(0).forEach((m) => m.remove()));

  it('makes an all-day calendar entry ending the day after the last day', async () => {
    setMeta('event-start', '2026-06-29');
    setMeta('event-end', '2026-07-01');
    const el = block();
    const text = await ics(el);
    expect(text).to.include('DTSTART;VALUE=DATE:20260629');
    expect(text).to.include('DTEND;VALUE=DATE:20260702');
    expect(text).to.include('SUMMARY:Summit\\; part 1');
    expect(el.querySelector('.event-chip').textContent).to.equal('Jun29Multi Day');
  });

  it('makes a timed calendar entry in the event time zone', async () => {
    setMeta('event-start', '2026-10-12T12:00');
    setMeta('event-end', '2026-10-12T12:30');
    setMeta('event-time-zone', 'America/Los_Angeles');
    const text = await ics(block());
    expect(text).to.include('DTSTART;TZID=America/Los_Angeles:20261012T120000');
    expect(text).to.include('DTEND;TZID=America/Los_Angeles:20261012T123000');
    expect(text).to.include('LOCATION:San Jose');
  });

  it('has no chip or calendar link without a start date', () => {
    const el = block();
    expect(el.querySelector('.event-chip')).to.be.null;
    expect(el.querySelector('.event-calendar')).to.be.null;
  });
});
