import { expect } from '@esm-bundle/chai';
import init from '../../blocks/news-list/news-list.js';

const tag = (type, value) => `/news?tagtype=${type}&tagValue=${type}:${value}`;
const article = (path, date, geography, tags = []) => ({
  path, title: path.split('/').pop(), date, geography, image: '', tags: JSON.stringify(tags),
});
const INDEX = {
  data: [
    article('/news/global', '2026-10-01', 'global', [tag('collection', 'need'), tag('article_topic', 'ops/security')]),
    article('/news/seattle', '2026-10-03', 'global/americas/united-states/seattle', [tag('collection', 'now')]),
    article('/news/us', '2026-10-02', 'global/americas/united-states', [tag('article_topic', 'adobe-life/benefits')]),
    article('/news/canada', '2026-09-30', 'global/americas/canada'),
    article('/news/london', '2026-10-04', 'global/emea/united-kingdom/london'),
  ],
};
const sheet = (rows) => ({ data: rows.map(([Name, Tag]) => ({ Name, Tag })) });
const FILTERS = {
  topics: sheet([['Adobe Life', 'article_topic:adobe-life'], ['Benefits & Wellbeing', 'article_topic:adobe-life/benefits'],
    ['Operations', 'article_topic:ops'], ['Security', 'article_topic:ops/security']]),
  collections: sheet([['Need to Know', 'collection:need'], ['Happening Now', 'collection:now']]),
  locations: sheet([['Global', 'geography:global'], ['Americas', 'geography:global/americas'],
    ['Canada', 'geography:global/americas/canada'], ['United States', 'geography:global/americas/united-states'],
    ['Seattle', 'geography:global/americas/united-states/seattle'], ['EMEA', 'geography:global/emea'],
    ['United Kingdom', 'geography:global/emea/united-kingdom'], ['London', 'geography:global/emea/united-kingdom/london']]),
};

const block = async () => {
  const el = document.createElement('div');
  el.innerHTML = '<div><div><h1>News</h1></div></div>';
  document.body.append(el);
  await init(el);
  return el;
};
const paths = (el) => [...el.querySelectorAll('.news-list-items > li > a')].map((a) => a.getAttribute('href'));
const chips = (el) => [...el.querySelectorAll('.news-list-chip')].map((c) => c.textContent);
const tick = (el, value, on) => {
  const box = el.querySelector(`input[value="${value}"]`);
  box.checked = on;
  box.dispatchEvent(new Event('change', { bubbles: true }));
};

describe('news-list', () => {
  const { fetch } = window;
  beforeEach(() => {
    window.fetch = async (url) => new Response(JSON.stringify(String(url).includes('filters') ? FILTERS : INDEX));
  });
  afterEach(() => {
    window.fetch = fetch;
    window.history.replaceState(null, '', window.location.pathname);
    document.querySelectorAll('.news-list-items').forEach((list) => list.parentElement.parentElement.remove());
  });

  it('starts with Global and the reader\'s region, newest first', async () => {
    const el = await block();
    expect(chips(el)).to.deep.equal(['Global', 'Americas']);
    expect(paths(el)).to.deep.equal(['/news/seattle', '/news/us', '/news/global', '/news/canada']);
    expect(el.querySelector('.news-list-count').textContent).to.equal('Displaying 4 of 4');
    expect(el.querySelector('.news-list-more').hidden).to.be.true;
    expect([...el.querySelectorAll('.news-list-geo li')].map((li) => li.textContent))
      .to.deep.equal(['Seattle', 'United States', 'Global', 'Canada']);
  });

  it('adds the tag from an article\'s tag link, and a parent topic covers its children', async () => {
    window.history.replaceState(null, '', '?tagtype=collection&tagValue=collection:need&label=Need%20to%20Know');
    const el = await block();
    expect(chips(el)).to.deep.equal(['Global', 'Americas', 'Need to Know']);
    expect(paths(el)).to.deep.equal(['/news/global']);
    el.querySelector('.news-list-chip:last-child').click();
    tick(el, 'article_topic:adobe-life', true);
    expect(paths(el)).to.deep.equal(['/news/us']);
    expect(el.querySelector('input[value="article_topic:adobe-life/benefits"]').checked).to.be.true;
  });

  it('unticking a place under a ticked region keeps the rest of the region', async () => {
    const el = await block();
    tick(el, 'geography:global/americas/united-states/seattle', false);
    expect(paths(el)).to.deep.equal(['/news/global', '/news/canada']);
    expect(chips(el)).to.deep.equal(['Global', 'Canada']);
    expect(el.querySelector('input[value="geography:global/americas"]').indeterminate).to.be.true;
    el.querySelector('.news-list-reset').click();
    expect(chips(el)).to.deep.equal(['Global', 'Americas']);
  });
});
