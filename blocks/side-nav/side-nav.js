import { getMetadata } from '../../scripts/ak.js';
import { loadFragment } from '../fragment/fragment.js';

const DESKTOP = window.matchMedia('(width >= 900px)');
const pathOf = (href) => new URL(href, window.location).pathname.replace(/\.html$/, '').replace(/\/$/, '');

// The section's menu: metadata "side-nav" (a name or a path), else the first path segment
export default async function init(el) {
  const name = getMetadata('side-nav') || window.location.pathname.split('/')[1];
  const path = name.startsWith('/') ? name : `/fragments/side-nav/${name}`;
  // Previews built from imported files (aem up --html-folder) serve them under /content
  const fragment = await loadFragment(path).catch(() => loadFragment(`/content${path}`));
  const title = fragment.querySelector('h2, h3');
  const list = fragment.querySelector('ul');
  if (!list) return;

  // current page: the longest menu link that is this page or one of its parents
  const here = pathOf(window.location.pathname);
  const current = [...list.querySelectorAll('a')]
    .filter((a) => here === pathOf(a.href) || here.startsWith(`${pathOf(a.href)}/`))
    .sort((a, b) => pathOf(b.href).length - pathOf(a.href).length)[0];
  current?.setAttribute('aria-current', 'page');

  const summary = document.createElement('summary');
  summary.textContent = (current || title)?.textContent.trim();
  const details = document.createElement('details');
  details.append(summary, ...[title, list].filter(Boolean));
  const nav = document.createElement('nav');
  nav.setAttribute('aria-label', title?.textContent.trim() || 'Section');
  nav.append(details);
  el.replaceChildren(nav);

  const sync = () => { details.open = DESKTOP.matches; };
  DESKTOP.addEventListener('change', sync);
  sync();
}
