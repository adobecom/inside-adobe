import { expect } from '@esm-bundle/chai';
import init from '../../blocks/news-box/news-box.js';

const tag = (value) => `/news?tagtype=article_topic&tagValue=${value}`;
const INDEX = {
  data: [
    { path: '/news/a', title: 'Founders', date: '2026-09-29', tags: JSON.stringify([tag('article_topic:adobe-life/awards')]) },
    { path: '/news/b', title: 'Benefits', date: '2026-10-06', tags: JSON.stringify([tag('article_topic:adobe-life/benefits')]) },
    { path: '/news/c', title: 'Tech Excellence', date: '2026-09-15', tags: JSON.stringify([tag('article_topic:adobe-life/awards')]) },
    { path: '/news/d', title: 'Older award', date: '2026-04-15', tags: JSON.stringify([tag('article_topic:adobe-life/awards/sub')]) },
  ],
};

const block = (rows) => {
  const el = document.createElement('div');
  el.innerHTML = `<div><div><h2>Latest Adobe Awards</h2></div><div><p><a href="/news">More</a></p></div></div>${rows}`;
  document.body.append(el);
  return el;
};
const titles = (el) => [...el.querySelectorAll('.news-box-title')].map((t) => t.textContent);

describe('news-box', () => {
  const { fetch } = window;
  afterEach(() => { window.fetch = fetch; });

  it('lists the newest articles with the tag (and its sub-tags), up to the limit', async () => {
    window.fetch = async () => new Response(JSON.stringify(INDEX));
    const el = block('<div><div>Tag</div><div>article_topic:adobe-life/awards</div></div><div><div>Limit</div><div>2</div></div>');
    await init(el);
    expect(titles(el)).to.deep.equal(['Founders', 'Tech Excellence']);
    expect(el.querySelector('.news-box-date').textContent).to.equal('Sep 29');
    expect(el.querySelector('.news-box-head')).to.exist;
    el.remove();
  });

  it('covers sub-topics', async () => {
    window.fetch = async () => new Response(JSON.stringify(INDEX));
    const el = block('<div><div>Tag</div><div>article_topic:adobe-life/awards</div></div>');
    await init(el);
    expect(titles(el)).to.deep.equal(['Founders', 'Tech Excellence', 'Older award']);
    el.remove();
  });
});
