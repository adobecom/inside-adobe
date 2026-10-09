/* eslint-disable */
/* global WebImporter */

/**
 * Builds the shared header fragment (/fragments/nav/header) from the Inside Adobe
 * global nav (#insideNav_header). Output follows the Author Kit header model:
 *   section 1 - brand: logo link, edition link, mobile menu toggle widget
 *   section 2 - main nav: nested list (menu > section heading > links)
 * The tools rail, intranet search and profile load live signed-in data and are
 * intentionally not migrated.
 */

const OFFICE_DIRECTORY = 'https://inside.corp.adobe.com/adobe-offices/office-directory.html';
const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

function link(document, href, label) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = label;
  return a;
}

function para(document, child) {
  const p = document.createElement('p');
  p.append(child);
  return p;
}

function image(document, src, alt) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  return img;
}

function buildBrand(document, nav) {
  const section = document.createElement('div');
  const logo = nav.querySelector('a.gnav-logo');
  const logoLink = link(document, logo.getAttribute('href'), '');
  logoLink.append(image(document, './media_inside-adobe-logo.svg', 'Inside Adobe'));
  section.append(para(document, logoLink));

  const edition = link(document, OFFICE_DIRECTORY, '');
  edition.append(image(document, './media_globe.svg', 'Edition'), ` ${text(nav.querySelector('.HeaderNav-region-text'))}`);
  section.append(para(document, edition));
  // the brand row is the only row visible in the collapsed mobile header, so the toggle lives here
  section.append(para(document, link(document, '/tools/widgets/toggle', 'Menu')));
  return section;
}

function buildMenus(document, nav) {
  const section = document.createElement('div');
  const list = document.createElement('ul');
  nav.querySelectorAll('.gnav-menu > li.gnav-menu-list-item').forEach((item) => {
    const li = document.createElement('li');
    li.append(para(document, link(document, '#', text(item.querySelector('.gnav-menu-label')))));
    const sections = document.createElement('ul');
    item.querySelectorAll('.gnav-sub-menu > li.gnav-sub-menu-list-item').forEach((sub) => {
      const a = sub.querySelector('a.gnav-sub-menu-link');
      const subLi = document.createElement('li');
      const links = [...sub.querySelectorAll('a.gnav-submenu-submenu-link')];
      const heading = link(document, a.getAttribute('href'), text(a));
      if (!links.length) {
        subLi.append(heading);
      } else {
        subLi.append(para(document, heading));
        const ul = document.createElement('ul');
        links.forEach((l) => {
          const linkLi = document.createElement('li');
          linkLi.append(link(document, l.getAttribute('href'), text(l)));
          ul.append(linkLi);
        });
        subLi.append(ul);
      }
      sections.append(subLi);
    });
    if (sections.children.length) li.append(sections);
    list.append(li);
  });
  section.append(list);
  return section;
}

export default {
  transform: ({ document, html }) => {
    // The importer strips <nav> from the live document, so read the original markup.
    const source = new DOMParser().parseFromString(html, 'text/html');
    const nav = source.querySelector('#insideNav_header');
    const main = document.createElement('div');
    const sections = [buildBrand(document, nav), buildMenus(document, nav)];
    sections.forEach((s, i) => {
      if (i) main.append(document.createElement('hr'));
      main.append(...s.childNodes);
    });
    return [{
      element: main,
      path: '/fragments/nav/header',
      report: {
        menus: nav.querySelectorAll('.gnav-menu > li.gnav-menu-list-item').length,
        links: main.querySelectorAll('a').length,
      },
    }];
  },
};
