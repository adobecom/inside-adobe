/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion (Accordion convention): 2 columns; after the block-name row, each row is
 * one accordion item: Title cell (the clickable question, plain text) | Content cell (the answer).
 * Source: .accordion > .toggle-container > .drop-tab-wrapper > .drop-tab-item.
 * The Content cell keeps text, images, buttons and tables in source order; tables become lists
 * (blocks can't hold tables). The Expand All / Collapse All links are rebuilt by the block.
 */
const TITLE = '.call-to-action-title, .callout-title, .image-text-header';
const PART = `.cmp-text, .call-to-action-desc, .image-text-description, ${TITLE}, table, img, a.spectrum-Button`;

function panelContent(panel, document) {
  const parts = [...panel.querySelectorAll(PART)].filter((el) => !el.parentElement.closest(PART));
  return parts.flatMap((el) => {
    if (el.matches('.cmp-text, .call-to-action-desc, .image-text-description')) return [...el.children];
    if (el.matches(TITLE)) {
      const p = document.createElement('p');
      p.append(Object.assign(document.createElement('strong'), { textContent: el.textContent.trim() }));
      return [p];
    }
    if (el.matches('a.spectrum-Button')) {
      const p = document.createElement('p');
      const strong = document.createElement('strong');
      const a = document.createElement('a');
      a.href = el.getAttribute('href');
      a.textContent = el.textContent.trim();
      strong.append(a);
      p.append(strong);
      return [p];
    }
    return [el];
  });
}

export default function parse(element, { document }) {
  const items = [...element.querySelectorAll('.drop-tab-item')].filter((item) => item.closest('.accordion') === element);
  const cells = items.map((item) => {
    const title = item.querySelector('.drop-tab-heading, .drop-tab-content');
    const panel = item.querySelector(':scope > .panel');
    return [title ? title.textContent.trim() : '', panel ? panelContent(panel, document) : []];
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }
  // A table inside a block would become a block of its own (named after its first row), so
  // tables in answers become lists: one item per row, each value labelled with its column header
  const asList = (table) => {
    const rows = [...table.querySelectorAll('tr')];
    const head = rows[0]?.querySelector('th') ? [...rows.shift().children].map((c) => c.textContent.trim()) : [];
    const ul = document.createElement('ul');
    rows.forEach((tr) => {
      const li = document.createElement('li');
      [...tr.children].forEach((cell, i) => {
        if (!cell.textContent.trim()) return;
        const p = document.createElement('p');
        if (head[i]) p.append(Object.assign(document.createElement('strong'), { textContent: `${head[i]}: ` }));
        cell.querySelectorAll('p').forEach((cp) => cp.replaceWith(...cp.childNodes, document.createElement('br')));
        p.append(...cell.childNodes);
        li.append(p);
      });
      if (li.children.length) ul.append(li);
    });
    return ul;
  };
  const flatten = (n) => {
    if (n?.matches?.('table')) return asList(n);
    n?.querySelectorAll?.('table').forEach((t) => t.replaceWith(asList(t)));
    return n;
  };
  const listed = cells.map((row) => row.map((c) => (Array.isArray(c) ? c.map(flatten) : flatten(c))));
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'accordion', cells: listed }));
}
