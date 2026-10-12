/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion (Accordion convention): 2 columns; after the block-name row, each row is
 * one accordion item: Title cell (the clickable question, plain text) | Content cell (the answer).
 * Source: .accordion > .toggle-container > .drop-tab-wrapper > .drop-tab-item.
 * The Content cell keeps text, tables, images and buttons in source order; tables stay plain
 * tables, because blocks can't nest. The Expand All / Collapse All links are rebuilt by the block.
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
  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}
