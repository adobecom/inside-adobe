/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-image. Base: columns.
 * Source: http://127.0.0.1:8765/adobe-mission-and-plan.html
 * One row, two cells in source order: text (.cmp-text: H4, paragraphs,
 * download links) and image (the bare img).
 */
export default function parse(element, { document }) {
  const items = element.querySelector('.dexter-FlexContainer-Items') || element;
  const cols = [...items.querySelectorAll(':scope > .text, :scope > .image')];

  const row = [];
  cols.forEach((col) => {
    if (col.classList.contains('image')) {
      const img = col.querySelector('img');
      if (img) row.push([img]);
    } else {
      const content = col.querySelector('.cmp-text') || col;
      row.push([...content.children]);
    }
  });

  if (!row.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-image', cells });
  element.replaceWith(block);
}
