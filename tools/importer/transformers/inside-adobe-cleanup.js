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

// Jump-link anchor ids (<h4><a id="x"></a>Title</h4>) -> Edge Delivery heading ids, per page
let anchors = {};
const slug = (text) => text.trim().replace(/\s+/g, ' ').toLowerCase().replace(/[^\p{L}\p{N} _-]/gu, '').replace(/ /g, '-');

// AEM-internal metadata that must not be carried over
const DROP_META = ['content-page-ref', 'template', 'pageType', 'geography', 'geo.region', 'geo.placename', 'role', 'businessunit', 'theme-color', 'robots'];

function unwrap(el) {
  el.replaceWith(...el.childNodes);
}

export default function transform(hookName, element, payload) {
  const doc = (payload && payload.document) || element.ownerDocument;

  if (hookName === TransformHook.beforeTransform) {
    // the importer strips empty anchors before transforming, so read them from the raw page
    anchors = {};
    const raw = new DOMParser().parseFromString(payload.html, 'text/html');
    raw.querySelectorAll('h1 a[id], h2 a[id], h3 a[id], h4 a[id], h5 a[id], h6 a[id]').forEach((a) => {
      if (!a.getAttribute('href')) anchors[a.id] = slug(a.closest('h1, h2, h3, h4, h5, h6').textContent);
    });

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
      '.socialshare',
      'div.alert.aem-GridColumn', // site-wide alert bar (hidden)
      '.xfreference:has(.stock)', // live stock quote
      '.xfreference:has(.topuserfavorites)', // personalized favorites
      '.articlecontent .hide', // hidden role / business-unit tags
      '.analytics-article-type',
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

    // Jump-to links to this page -> in-page hashes
    const source = payload.params?.originalURL;
    const page = source ? new URL(source).pathname.split('/').pop() : '';
    content.querySelectorAll('a[href*="#"]').forEach((a) => {
      const [path, id] = a.getAttribute('href').split('#');
      if (anchors[id] && path.endsWith(`/${page}`)) a.setAttribute('href', `#${anchors[id]}`);
    });

    // Spectrum CTA buttons in default content -> bold link (primary button)
    content.querySelectorAll('a.spectrum-Button').forEach((btn) => {
      const p = doc.createElement('p');
      const strong = doc.createElement('strong');
      const a = doc.createElement('a');
      a.href = btn.getAttribute('href');
      a.textContent = btn.textContent.trim();
      strong.append(a);
      p.append(strong);
      (btn.closest('.cta.aem-GridColumn, .dexter-Cta') || btn).replaceWith(p);
    });

    // Outlook click-tracking (and SharePoint share tokens) on links copied from email
    content.querySelectorAll('a[href*="xsdata="], a[href*="clickparams="]').forEach((a) => {
      const url = new URL(a.getAttribute('href'));
      ['xsdata', 'sdata', 'clickparams'].forEach((p) => url.searchParams.delete(p));
      if (url.hostname.endsWith('sharepoint.com')) url.searchParams.delete('e');
      a.setAttribute('href', url.href);
    });

    // Empty <a id="..."></a> anchors inside headings
    content.querySelectorAll('h1 a[id], h2 a[id], h3 a[id], h4 a[id], h5 a[id], h6 a[id]').forEach((a) => {
      if (!a.getAttribute('href') && !a.textContent.trim()) a.remove();
    });

    // Promote H4 topic / H5 group headings to H2 / H3 (main content column only)
    content.querySelectorAll('h4, h5').forEach((h) => {
      const heading = doc.createElement(h.tagName === 'H4' ? 'h2' : 'h3');
      heading.append(...h.childNodes);
      heading.querySelectorAll('b, strong').forEach(unwrap);
      h.replaceWith(heading);
    });

    // Presentational wrappers
    content.querySelectorAll('b[data-rte-class="rte-temp"]').forEach(unwrap);
    content.querySelectorAll('span.body-text-1, span.body-text-2').forEach(unwrap);

    // (after the span unwrap above, so links nested in spans are found too)
    // A bold/italic run holding a link plus other text would become a button that swallows the
    // text (ak.js decorateButton only checks the paragraph); take the link out of the run
    // (links are bold here anyway). Emphasis inside the link would be merged back by markdown.
    content.querySelectorAll('strong > a, em > a, b > a, i > a').forEach((a) => {
      const wrap = a.parentElement;
      if (wrap.textContent.trim() === a.textContent.trim()) return;
      const after = wrap.cloneNode(false);
      while (a.nextSibling) after.append(a.nextSibling);
      wrap.after(a, after);
      [wrap, after].forEach((w) => { if (!w.textContent.trim()) w.remove(); });
    });

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
