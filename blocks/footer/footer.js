import { getConfig, getMetadata } from '../../scripts/ak.js';
import { loadFragment } from '../fragment/fragment.js';

const FOOTER_PATH = '/fragments/nav/footer';
const DESKTOP = matchMedia('(width >= 900px)');

// Below 900px each column heading becomes a button that toggles its link list
function syncColumns(headings) {
  for (const heading of headings) {
    const btn = heading.querySelector('button');
    if (DESKTOP.matches) {
      btn?.replaceWith(...btn.childNodes);
    } else if (!btn) {
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.ariaExpanded = 'false';
      toggle.append(...heading.childNodes);
      toggle.addEventListener('click', () => {
        toggle.ariaExpanded = String(toggle.ariaExpanded !== 'true');
      });
      heading.append(toggle);
    }
  }
}

function wrap(className, nodes) {
  const div = document.createElement('div');
  div.className = className;
  div.append(...nodes);
  return div;
}

/**
 * loads and decorates the footer
 * @param {Element} el The footer element
 */
export default async function init(el) {
  const { locale } = getConfig();
  const footerMeta = getMetadata('footer-source');
  const path = footerMeta || FOOTER_PATH;
  try {
    // Previews built from imported files (aem up --html-folder) serve them under /content
    const fragment = await loadFragment(`${locale.prefix}${path}`)
      .catch(() => loadFragment(`/content${locale.prefix}${path}`));
    fragment.classList.add('footer-content');

    const sections = [...fragment.querySelectorAll('.section')];

    const copyright = sections.pop();
    copyright.classList.add('section-copyright');

    const legal = sections.pop();
    legal.classList.add('section-legal');

    const headings = sections.map((s) => s.querySelector('h2')).filter(Boolean);
    syncColumns(headings);
    DESKTOP.addEventListener('change', () => syncColumns(headings));
    fragment.append(wrap('footer-main', sections), wrap('footer-bar', [legal, copyright]));

    el.append(fragment);
  } catch (e) {
    throw Error(e);
  }
}
