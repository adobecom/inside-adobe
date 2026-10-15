import { createPicture } from '../../scripts/utils/picture.js';
import { getEdition } from '../../scripts/utils/edition.js';

// The news listing, as on the intranet: filters by topic, collection and location (Global and
// the reader's region to start with; an article's tag link adds its tag), newest first, 15 at a
// time. Filter lists come from the /news-filters sheet, articles from the news index.
const INDEX = '/news/query-index.json';
const FILTERS = '/news-filters.json?sheet=topics&sheet=collections&sheet=locations';
const PAGE = 15;
const PANELS = [['topics', 'Article Topics'], ['collections', 'Collections'], ['locations', 'Locations']];
const GLOBAL = 'geography:global';

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};
const category = (tag) => tag.split(':')[0];
// a selection covers its own tag and everything under it; Global only itself
const covers = (sel, tag) => tag === sel || (sel !== GLOBAL && tag.startsWith(`${sel}/`));
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

function defaults() {
  const { geo } = getEdition();
  const region = geo.split('/').slice(0, 2).join('/');
  return [GLOBAL, ...(region.includes('/') ? [`geography:${region}`] : [])];
}

export default async function init(block) {
  const [head, ...aside] = block.children;
  head.className = 'news-list-head';
  const [index, filters] = await Promise.all([INDEX, FILTERS].map((url) => fetch(url)
    .then((r) => (r.ok ? r.json() : null)).catch(() => null)));
  if (!index) throw new Error('news index unavailable');

  // the filter trees: tag → node, children by path
  const nodes = new Map();
  PANELS.forEach(([sheet]) => (filters?.[sheet]?.data || []).forEach(({ Name, Tag }) => {
    nodes.set(Tag, { name: Name, tag: Tag, children: [] });
  }));
  nodes.forEach((node) => {
    // Global sits beside the regions, not above them
    const up = node.tag.slice(0, node.tag.lastIndexOf('/'));
    const parent = up !== GLOBAL ? nodes.get(up) : undefined;
    if (parent) parent.children.push(node);
    node.parent = parent;
  });
  const name = (tag) => {
    const node = nodes.get(tag);
    return node?.name === 'Remote' ? node.parent?.name : node?.name;
  };

  const articles = index.data
    .map((row) => ({ ...row, all: articleTags(row) }))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const selected = new Set(defaults());
  const { searchParams } = new URL(window.location.href);
  if (searchParams.get('tagValue')) selected.add(searchParams.get('tagValue'));
  let shown = PAGE;

  // the smallest set of tags for the ticked boxes: a parent replaces all of its children
  const isOn = (tag) => [...selected].some((sel) => covers(sel, tag));
  const normalize = (node) => {
    const parent = node?.parent;
    if (parent?.children.every((child) => selected.has(child.tag))) {
      parent.children.forEach((child) => selected.delete(child.tag));
      selected.add(parent.tag);
      normalize(parent);
    }
  };
  // unticking under a ticked ancestor: keep the ancestor's other branches
  const untick = (node) => {
    if (selected.delete(node.tag) || !node.parent || !isOn(node.parent.tag)) return;
    untick(node.parent);
    node.parent.children.forEach((child) => child !== node && selected.add(child.tag));
  };
  const toggle = (tag, on) => {
    [...selected].forEach((sel) => sel !== tag && covers(tag, sel) && selected.delete(sel));
    if (!on) {
      if (nodes.has(tag)) untick(nodes.get(tag));
      else selected.delete(tag);
      return;
    }
    selected.add(tag);
    normalize(nodes.get(tag));
  };

  // filters column
  const panel = el('div', 'news-list-filters');
  const title = el('div', 'news-list-filters-title');
  const reset = el('button', 'news-list-reset', 'Reset Filters');
  reset.type = 'button';
  title.append(el('h2', '', 'Filters'), reset);
  panel.append(title);
  const boxes = [];
  const tree = (items) => {
    const ul = el('ul');
    items.filter((node) => node.name !== 'Remote').forEach((node) => {
      const li = el('li');
      const label = el('label');
      const box = el('input');
      box.type = 'checkbox';
      box.value = node.tag;
      boxes.push(box);
      label.append(box, node.name);
      li.append(label);
      const kids = node.children.filter((child) => child.name !== 'Remote');
      if (kids.length) {
        const sub = tree(kids);
        sub.hidden = true;
        const expand = el('button', 'news-list-expand');
        expand.type = 'button';
        expand.ariaLabel = `${node.name} options`;
        expand.ariaExpanded = 'false';
        expand.addEventListener('click', () => {
          sub.hidden = !sub.hidden;
          expand.ariaExpanded = String(!sub.hidden);
        });
        li.append(expand, sub);
      }
      ul.append(li);
    });
    return ul;
  };
  PANELS.forEach(([sheet, heading]) => {
    const details = el('details');
    details.append(el('summary', '', heading), tree((filters?.[sheet]?.data || [])
      .map(({ Tag }) => nodes.get(Tag)).filter((node) => !node.parent)));
    panel.append(details);
  });
  const side = el('div', 'news-list-aside');
  side.append(panel, ...aside);

  // results column
  const chips = el('div', 'news-list-chips');
  const items = el('ul', 'news-list-items');
  const count = el('p', 'news-list-count');
  const more = el('button', 'news-list-more');
  more.type = 'button';
  const main = el('div', 'news-list-main');
  const foot = el('div', 'news-list-foot');
  foot.append(count, more);
  main.append(head, chips, items, foot);
  block.append(side, main);

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
    const places = row.all.filter((tag) => category(tag) === 'geography').map(name);
    const unique = [...new Set(places.filter(Boolean))];
    geo.append(...(unique.length ? unique : ['Global']).map((place) => el('li', '', place)));
    text.append(el('p', 'news-list-date', date), geo, el('p', 'news-list-title', row.title));
    link.append(text);
    const li = el('li');
    li.append(link);
    return li;
  };

  const render = () => {
    boxes.forEach((box) => {
      box.checked = isOn(box.value);
      box.indeterminate = !box.checked
        && [...selected].some((sel) => sel !== box.value && covers(box.value, sel));
    });
    chips.replaceChildren(...[...selected].map((tag) => {
      const chip = el('button', 'news-list-chip', name(tag) || tag.split('/').pop());
      chip.type = 'button';
      chip.ariaLabel = `Remove ${chip.textContent}`;
      chip.addEventListener('click', () => {
        selected.delete(tag);
        shown = PAGE;
        render();
      });
      return chip;
    }));
    const groups = Object.groupBy([...selected], category);
    const matches = articles.filter((row) => Object.values(groups)
      .every((sels) => row.all.some((tag) => sels.some((sel) => covers(sel, tag)))));
    items.replaceChildren(...matches.slice(0, shown).map(item));
    count.textContent = `Displaying ${Math.min(shown, matches.length)} of ${matches.length}`;
    more.hidden = shown >= matches.length;
    more.textContent = `Load ${Math.min(PAGE, matches.length - shown)} more articles`;
  };

  panel.addEventListener('change', ({ target }) => {
    toggle(target.value, target.checked);
    shown = PAGE;
    render();
  });
  reset.addEventListener('click', () => {
    selected.clear();
    defaults().forEach((tag) => selected.add(tag));
    shown = PAGE;
    render();
  });
  more.addEventListener('click', () => {
    shown += PAGE;
    render();
  });
  window.addEventListener('edition-change', () => {
    [...selected].filter((tag) => category(tag) === 'geography').forEach((tag) => selected.delete(tag));
    defaults().forEach((tag) => selected.add(tag));
    shown = PAGE;
    render();
  });
  render();
}
