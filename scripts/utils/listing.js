import { getConfig, loadStyle } from '../ak.js';
import { getEdition } from './edition.js';

// The news and events listings, as on the intranet: a filters column, then the heading, chips,
// results and Load more (styles/listing.css). Tag filters are nested checkboxes per group
// (ticking a parent ticks its children), a chip per selection, Global plus the reader's region
// to start with. Tags look like `geography:global/americas`; a parent is a path prefix.
export const GLOBAL = 'geography:global';
export const category = (tag) => tag.split(':')[0];
// a selection covers its own tag and everything under it; Global only itself
export const covers = (sel, tag) => tag === sel || (sel !== GLOBAL && tag.startsWith(`${sel}/`));

export function regionDefaults() {
  const region = getEdition().geo.split('/').slice(0, 2).join('/');
  return [GLOBAL, ...(region.includes('/') ? [`geography:${region}`] : [])];
}

export const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

/**
 * @param {Array} groups [[heading, rows]], rows from a sheet: { Name, Tag }
 * @param {Function} onChange called after every change to the selection
 */
export function tagFilters(groups, onChange) {
  const nodes = new Map();
  groups.forEach(([, rows]) => rows.forEach(({ Name, Tag }) => {
    nodes.set(Tag, { name: Name, tag: Tag, children: [] });
  }));
  nodes.forEach((node) => {
    // Global sits beside the regions, not above them
    const up = node.tag.slice(0, node.tag.lastIndexOf('/'));
    const parent = up !== GLOBAL ? nodes.get(up) : undefined;
    if (parent) parent.children.push(node);
    node.parent = parent;
  });
  const byName = new Map([...nodes.values()].map((node) => [
    `${category(node.tag)}:${node.name.toLowerCase()}`, node.tag]));
  const name = (tag) => {
    const node = nodes.get(tag);
    return node?.name === 'Remote' ? node.parent?.name : node?.name;
  };

  const selected = new Set(regionDefaults());
  const isOn = (tag) => [...selected].some((sel) => covers(sel, tag));
  // the smallest set of tags for the ticked boxes: a parent replaces all of its children
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
        const expand = el('button', 'tag-filters-expand');
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
  const panels = groups.map(([heading, rows]) => {
    const details = el('details');
    details.append(el('summary', '', heading), tree(rows
      .map(({ Tag }) => nodes.get(Tag)).filter((node) => !node.parent)));
    details.addEventListener('change', ({ target }) => {
      toggle(target.value, target.checked);
      onChange();
    });
    return details;
  });

  return {
    panels,
    name,
    // a label as authored on a page ("Benefits & Wellbeing", "virtual") → its tag
    tagFor: (group, label) => byName.get(`${group}:${label.trim().toLowerCase()}`),
    add(tag) {
      selected.add(tag);
    },
    reset() {
      selected.clear();
      regionDefaults().forEach((tag) => selected.add(tag));
    },
    resetLocations() {
      [...selected].forEach((tag) => category(tag) === 'geography' && selected.delete(tag));
      regionDefaults().forEach((tag) => selected.add(tag));
    },
    // all groups with a selection must match; within a group any tag does
    matches(tags) {
      return Object.values(Object.groupBy([...selected], category))
        .every((sels) => tags.some((tag) => sels.some((sel) => covers(sel, tag))));
    },
    // ticks to match the selection, and a removable chip per selected tag
    chips() {
      boxes.forEach((box) => {
        box.checked = isOn(box.value);
        box.indeterminate = !box.checked
          && [...selected].some((sel) => sel !== box.value && covers(box.value, sel));
      });
      return [...selected].map((tag) => {
        const chip = el('button', 'tag-filters-chip', name(tag) || tag.split('/').pop());
        chip.type = 'button';
        chip.ariaLabel = `Remove ${chip.textContent}`;
        chip.addEventListener('click', () => {
          selected.delete(tag);
          onChange();
        });
        return chip;
      });
    },
  };
}

/**
 * The page shell around a block: row 1 is the heading, further rows go under the filters.
 * @returns the parts the block fills in and listens to
 */
export function listingShell(block, panels) {
  loadStyle(`${getConfig().codeBase}/styles/listing.css`);
  const [head, ...extras] = block.children;
  block.classList.add('listing');
  head.className = 'listing-head';
  extras.forEach((extra) => extra.classList.add('listing-extra'));

  const filters = el('div', 'listing-filters');
  const title = el('div', 'listing-filters-title');
  const reset = el('button', 'listing-reset', 'Reset Filters');
  reset.type = 'button';
  title.append(el('h2', '', 'Filters'), reset);
  filters.append(title, ...panels);
  const side = el('div', 'listing-aside');
  side.append(filters, ...extras);

  const chips = el('div', 'listing-chips');
  const items = el('ul', 'listing-items');
  const count = el('p', 'listing-count');
  const more = el('button', 'listing-more');
  more.type = 'button';
  const foot = el('div', 'listing-foot');
  foot.append(count, more);
  const main = el('div', 'listing-main');
  main.append(head, chips, items, foot);
  block.append(side, main);
  return {
    side, filters, reset, chips, items, count, more,
  };
}
