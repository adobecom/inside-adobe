/* eslint-disable */
/* global WebImporter */
/**
 * Parser for accordion (Accordion convention): one row per item,
 *   cell 1: the question (plain text)   cell 2: the answer content
 * Source: .accordion > .toggle-container > .drop-tab-wrapper > .drop-tab-item.
 * The Expand All / Collapse All links are rebuilt by the block, so they are dropped.
 */
export default function parse(element, { document }) {
  const cells = [...element.querySelectorAll('.drop-tab-item')].map((item) => {
    const title = item.querySelector('.drop-tab-heading, .drop-tab-content');
    const panel = item.querySelector('.panel');
    const content = panel ? [...panel.querySelectorAll('.cmp-text')].flatMap((t) => [...t.children]) : [];
    return [title ? title.textContent.trim() : '', content];
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }
  const block = WebImporter.Blocks.createBlock(document, { name: 'accordion', cells });
  element.replaceWith(block);
}
