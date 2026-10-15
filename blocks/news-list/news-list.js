import { createPicture } from '../../scripts/utils/picture.js';
import {
  category, el, listingShell, tagFilters,
} from '../../scripts/utils/listing.js';

// The news listing, as on the intranet: filters by topic, collection and location (Global and
// the reader's region to start with; an article's tag link adds its tag), newest first, 15 at a
// time. Filter lists come from the /news-filters sheet, articles from the news index.
const INDEX = '/news/query-index.json';
const FILTERS = '/news-filters.json?sheet=topics&sheet=collections&sheet=locations';
const PAGE = 15;
const GROUPS = [['topics', 'Article Topics'], ['collections', 'Collections'], ['locations', 'Locations']];

const list = (value) => {
  if (Array.isArray(value)) return value;
  try {
    return JSON.parse(value || '[]');
  } catch {
    return [];
  }
};

function articleTags(row) {
  const tags = list(row.tags)
    .map((href) => new URL(href, window.location.href).searchParams.get('tagValue'));
  const geo = (row.geography || '').split(',').map((t) => t.trim()).filter(Boolean);
  return [...tags.filter(Boolean), ...geo.map((g) => `geography:${g}`)];
}

export default async function init(block) {
  const [index, sheets] = await Promise.all([INDEX, FILTERS].map((url) => fetch(url)
    .then((r) => (r.ok ? r.json() : null)).catch(() => null)));
  if (!index) throw new Error('news index unavailable');

  const articles = index.data
    .map((row) => ({ ...row, all: articleTags(row) }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  let shown = PAGE;
  let render;
  const groups = GROUPS.map(([sheet, heading]) => [heading, sheets?.[sheet]?.data || []]);
  const filters = tagFilters(groups, () => {
    shown = PAGE;
    render();
  });
  const tagValue = new URL(window.location.href).searchParams.get('tagValue');
  if (tagValue) filters.add(tagValue);
  const {
    reset, chips, items, count, more,
  } = listingShell(block, filters.panels);
  items.classList.add('news-list-items');

  const item = (row) => {
    const link = el('a');
    link.href = row.path;
    link.ariaLabel = row.title;
    if (row.image) link.append(createPicture({ src: row.image, alt: '', breakpoints: [{ width: '600' }] }));
    const text = el('div', 'news-list-text');
    const date = row.date && new Date(row.date).toLocaleDateString('en-US', {
      month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC',
    });
    const geo = el('ul', 'news-list-geo');
    const places = row.all.filter((tag) => category(tag) === 'geography').map(filters.name);
    const unique = [...new Set(places.filter(Boolean))];
    geo.append(...(unique.length ? unique : ['Global']).map((place) => el('li', '', place)));
    text.append(el('p', 'news-list-date', date), geo, el('p', 'news-list-title', row.title));
    link.append(text);
    const li = el('li');
    li.append(link);
    return li;
  };

  render = () => {
    chips.replaceChildren(...filters.chips());
    const matches = articles.filter((row) => filters.matches(row.all));
    items.replaceChildren(...matches.slice(0, shown).map(item));
    count.textContent = `Displaying ${Math.min(shown, matches.length)} of ${matches.length}`;
    more.hidden = shown >= matches.length;
    more.textContent = `Load ${Math.min(PAGE, matches.length - shown)} more articles`;
  };

  reset.addEventListener('click', () => {
    filters.reset();
    shown = PAGE;
    render();
  });
  more.addEventListener('click', () => {
    shown += PAGE;
    render();
  });
  window.addEventListener('edition-change', () => {
    filters.resetLocations();
    shown = PAGE;
    render();
  });
  render();
}
