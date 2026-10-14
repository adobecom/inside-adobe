import { getEdition, pickVersion } from '../../scripts/utils/edition.js';

// One row per version of a topic: link to the version | the geographies it serves, comma-separated
// (or "manager"). Opens the reader's version; with no match it stays a list to choose from.
// ?versions keeps the list (for authors).
export default function init(el) {
  const versions = [...el.children].map((row) => {
    const [link, tags] = row.children;
    const a = link?.querySelector('a');
    const list = (tags?.textContent || '').split(',').map((t) => t.trim().replace(/^geography:/, ''));
    return { a, href: a?.getAttribute('href'), tags: list.filter(Boolean) };
  }).filter((v) => v.href);

  const ul = document.createElement('ul');
  versions.forEach(({ a }) => {
    const li = document.createElement('li');
    li.append(a);
    ul.append(li);
  });
  el.replaceChildren(ul);

  const match = pickVersion(versions, getEdition());
  if (match && !new URLSearchParams(window.location.search).has('versions')) {
    window.location.replace(`${new URL(match.href, window.location.href).pathname}${window.location.hash}`);
  }
}
