/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: Inside Adobe (inside.corp.adobe.com) site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html / the local source copy.
 *
 * Note: siblings of `.aem-Grid--9` (horizontalRule, dexter-Spacer) are removed only in
 * afterTransform, because block parsers and the sections transformer resolve
 * `.aem-Grid--9 > .x:nth-of-type(n)` selectors that count those divs.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

const PAGE_URL = 'inside.corp.adobe.com/content/inside/en/about-adobe/adobe-mission-and-plan.html';

// Source jump-link anchors -> Edge Delivery auto-generated heading ids
const JUMP_IDS = {
  onepage: 'adobes-mission--plan--all-on-one-page',
  mission: 'our-mission',
  values: 'our-company-values',
  what: 'what-we-do',
  audience: 'our-audience-strategy',
  wins: 'fy26-must-wins',
  videos: 'videos',
  resources: 'resources',
};

// AEM-internal metadata that must not be carried over
const DROP_META = ['content-page-ref', 'template', 'pageType', 'geography', 'geo.region', 'geo.placename', 'role', 'businessunit', 'theme-color', 'robots'];

function unwrap(el) {
  el.replaceWith(...el.childNodes);
}

export default function transform(hookName, element, payload) {
  const doc = (payload && payload.document) || element.ownerDocument;

  if (hookName === TransformHook.beforeTransform) {
    // Metadata: strip the site suffix from the title and drop AEM-internal meta tags
    if (doc.title) doc.title = doc.title.replace(/\s*\|\s*Inside Adobe\s*$/i, '').trim();
    DROP_META.forEach((name) => {
      doc.querySelectorAll(`head meta[name="${name}"]`).forEach((m) => m.remove());
    });

    // Left side nav: remove the whole 3-column grid column that holds it
    const sideNavCol = element.querySelector('#root_content_position_position-par_position_1');
    if (sideNavCol && sideNavCol.parentElement && sideNavCol.parentElement.classList.contains('position')) {
      sideNavCol.parentElement.remove();
    }

    // Edition picker modal: remove its anonymous wrapper div too
    element.querySelectorAll('.edition-selection-popup').forEach((popup) => {
      const wrap = popup.parentElement;
      if (wrap && wrap.tagName === 'DIV' && !wrap.className && wrap.children.length === 1) wrap.remove();
      else popup.remove();
    });

    WebImporter.DOMUtils.remove(element, [
      'a.skip-link',
      '.gnav-spacing',
      '#insideNav_header',
      '#flyoutcontainer', // employee-directory / profile / quick-links flyout
      '.inside-analytics',
      '#consent-popup-text',
      '.workdayedit-popup-text',
      'div.banner.aem-GridColumn', // employee-directory / glean search banner
      '.falcon-side-nav',
      '.sidenav.aem-GridColumn',
      '#my-favorite-button',
      '.favorite-btn',
      '.modalContainer',
      '.edition-selection-popup',
      '.accordion-wrapper',
      '.accordion-item',
      'a.scroll-to-top',
      '#insideNav_footer',
      '.evidon-notice-link',
      'img.overlay-image', // decorative play_solid_white overlay on video thumbnails
      'style',
      'script',
      'noscript',
      'iframe',
      'link',
    ]);
  }

  if (hookName === TransformHook.afterTransform) {
    // Visual dividers / spacers (section breaks come from the sections transformer)
    WebImporter.DOMUtils.remove(element, [
      'div.horizontalRule.aem-GridColumn',
      'div.dexter-Spacer.aem-GridColumn',
      'style',
      'script',
      'noscript',
      'iframe',
      'link',
    ]);

    const content = element.querySelector('.aem-Grid--9') || element;

    // Jump-to links -> in-page hashes
    content.querySelectorAll('a[href*="#"]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href.includes(PAGE_URL)) return;
      const id = href.split('#')[1];
      if (JUMP_IDS[id]) a.setAttribute('href', `#${JUMP_IDS[id]}`);
    });

    // Empty <a id="..."></a> anchors inside headings
    content.querySelectorAll('h1 a[id], h2 a[id], h3 a[id], h4 a[id], h5 a[id], h6 a[id]').forEach((a) => {
      if (!a.getAttribute('href') && !a.textContent.trim()) a.remove();
    });

    // Promote H4 topic headings to H2 (main content column only)
    content.querySelectorAll('h4').forEach((h4) => {
      const h2 = doc.createElement('h2');
      h2.append(...h4.childNodes);
      h4.replaceWith(h2);
    });

    // Presentational wrappers
    content.querySelectorAll('b[data-rte-class="rte-temp"]').forEach(unwrap);
    content.querySelectorAll('span.body-text-1, span.body-text-2').forEach(unwrap);

    // &nbsp; noise: normalize to plain spaces, drop whitespace-only inline wrappers and paragraphs
    const walker = doc.createTreeWalker(content, 4 /* NodeFilter.SHOW_TEXT */);
    const texts = [];
    while (walker.nextNode()) texts.push(walker.currentNode);
    texts.forEach((t) => {
      if (t.nodeValue.includes(' ')) t.nodeValue = t.nodeValue.replace(/ /g, ' ');
    });
    content.querySelectorAll('b, i, strong, em, span').forEach((el) => {
      if (!el.textContent.trim() && !el.querySelector('img, picture, br, a')) el.replaceWith(doc.createTextNode(' '));
    });
    content.querySelectorAll('p').forEach((p) => {
      if (!p.textContent.trim() && !p.querySelector('img, picture, a, table')) p.remove();
    });
  }
}
