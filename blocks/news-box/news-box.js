import { createPicture } from '../../scripts/utils/picture.js';

// A short list of the newest articles with one tag, as the intranet's embedded news lists:
// heading (and a More link), then image, date and title per article. Rows: Tag (e.g.
// article_topic:adobe-life/awards, which covers its sub-topics) and Limit.
const INDEX = '/news/query-index.json';
const LIMIT = 5;

const list = (value) => {
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value || '[]');
  } catch {
    return [];
  }
};
const tagsOf = (row) => list(row.tags)
  .map((href) => new URL(href, window.location.href).searchParams.get('tagValue'));

function item({
  path, title, image, date,
}) {
  const link = document.createElement('a');
  link.href = path;
  if (image) link.append(createPicture({ src: image, alt: '', breakpoints: [{ width: '140' }] }));
  const text = document.createElement('div');
  text.className = 'news-box-text';
  const day = document.createElement('p');
  day.className = 'news-box-date';
  day.textContent = date && new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' });
  const name = document.createElement('p');
  name.className = 'news-box-title';
  name.textContent = title;
  text.append(day, name);
  link.append(text);
  const li = document.createElement('li');
  li.append(link);
  return li;
}

export default async function init(el) {
  const [head, ...rows] = el.children;
  head.className = 'news-box-head';
  const options = Object.fromEntries(rows.map((row) => [...row.children]
    .map((cell) => cell.textContent.trim())).map(([key, value]) => [key.toLowerCase(), value]));
  rows.forEach((row) => row.remove());
  const ul = document.createElement('ul');
  el.append(ul);

  const resp = await fetch(INDEX);
  if (!resp.ok) throw new Error(`news index: ${resp.status}`);
  const { data } = await resp.json();
  const { tag, limit } = options;
  const covered = (t) => t && (!tag || t === tag || t.startsWith(`${tag}/`));
  ul.append(...data
    .filter((row) => tagsOf(row).some(covered))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .slice(0, Number(limit) || LIMIT)
    .map(item));
}
