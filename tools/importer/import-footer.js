/* eslint-disable */
/* global WebImporter */

/**
 * Builds the shared footer fragment (/fragments/nav/footer) from the Inside Adobe
 * footer (#insideNav_footer). Output follows the Author Kit footer model:
 *   one section per link column (heading + list)
 *   legal section (second to last): edition link + legal links
 *   copyright section (last): copyright line
 * The edition picker loads live data, so it links to the office directory.
 */

const OFFICE_DIRECTORY = 'https://inside.corp.adobe.com/adobe-offices/office-directory.html';
const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

function link(document, href, label) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = label;
  return a;
}

function list(document, anchors) {
  const ul = document.createElement('ul');
  anchors.forEach((a) => {
    const li = document.createElement('li');
    li.append(link(document, a.getAttribute('href'), text(a)));
    ul.append(li);
  });
  return ul;
}

export default {
  transform: ({ document, html }) => {
    // The importer strips <footer> from the live document, so read the original markup.
    const source = new DOMParser().parseFromString(html, 'text/html');
    const footer = source.querySelector('#insideNav_footer');
    const sections = [];

    footer.querySelectorAll('.footer-nav-menu-item').forEach((col) => {
      const section = document.createElement('div');
      const h2 = document.createElement('h2');
      h2.textContent = text(col.querySelector('.footer-nav-menu-label'));
      section.append(h2, list(document, [...col.querySelectorAll('a.footer-nav-sub-menu-link')]));
      sections.push(section);
    });

    const misc = footer.querySelector('.footer-nav-misc');
    const legal = document.createElement('div');
    const edition = link(document, OFFICE_DIRECTORY, '');
    const globe = document.createElement('img');
    globe.src = './media_globe-footer.svg';
    globe.alt = 'Edition';
    edition.append(globe, ` ${text(misc.querySelector('.HeaderNav-region-text'))}`);
    const p = document.createElement('p');
    p.append(edition);
    legal.append(p, list(document, [...misc.querySelectorAll('.footer-nav-misc-items a')]));
    sections.push(legal);

    const copyright = document.createElement('div');
    const cp = document.createElement('p');
    cp.textContent = text(misc.querySelector('.footer-nav-misc-items li'));
    copyright.append(cp);
    sections.push(copyright);

    const main = document.createElement('div');
    sections.forEach((s, i) => {
      if (i) main.append(document.createElement('hr'));
      main.append(...s.childNodes);
    });
    return [{
      element: main,
      path: '/fragments/nav/footer',
      report: { columns: sections.length - 2, links: main.querySelectorAll('a').length },
    }];
  },
};
