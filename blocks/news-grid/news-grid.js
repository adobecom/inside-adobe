import { createPicture } from '../../scripts/utils/picture.js';
import { getEdition, inEdition } from '../../scripts/utils/edition.js';

const INDEX = '/news/query-index.json';
const LIMIT = 10;

function tile({
  path, title, subtitle, image, collection, date,
}) {
  const day = date && new Date(date).toLocaleDateString('en-US', { month: 'short', day: '2-digit', timeZone: 'UTC' });
  const label = document.createElement('p');
  label.className = 'news-grid-label';
  label.textContent = [day?.toUpperCase(), collection].filter(Boolean).join(' | ');
  const heading = document.createElement('h3');
  heading.textContent = title;
  const sub = document.createElement('p');
  sub.textContent = subtitle;

  const text = document.createElement('div');
  text.className = 'news-grid-text';
  text.append(label, heading, sub);
  const link = document.createElement('a');
  link.href = path;
  if (image) link.append(createPicture({ src: image, alt: '', breakpoints: [{ width: '750' }] }));
  link.append(text);
  const li = document.createElement('li');
  li.append(link);
  return li;
}

// the latest articles for the reader's edition (the header's edition picker), again on a change
export default async function init(el) {
  const resp = await fetch(INDEX);
  if (!resp.ok) throw new Error(`news index: ${resp.status}`);
  const { data } = await resp.json();
  const latest = data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const render = () => {
    const edition = getEdition();
    const list = document.createElement('ul');
    const tags = (row) => (row.geography || '').split(',').map((t) => t.trim()).filter(Boolean);
    list.append(...latest
      .filter((row) => inEdition(tags(row), edition))
      .slice(0, LIMIT)
      .map(tile));
    el.replaceChildren(list);
  };
  render();
  window.addEventListener('edition-change', render);
}
