/* eslint-disable */
/* global WebImporter */
/**
 * Parser for callout: .callout-container info box.
 * One cell: the title as a bold paragraph, then the callout text.
 * The info icon is drawn by the block, so the source image is dropped.
 */
export default function parse(element, { document }) {
  const title = element.querySelector('.callout-title');
  const text = element.querySelector('.callout-text');

  const cell = [];
  if (title) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = title.textContent.trim();
    p.append(strong);
    cell.push(p);
  }
  if (text) cell.push(...text.children);

  const name = element.querySelector('.callout-container.alert') ? 'callout (alert)' : 'callout';
  const block = WebImporter.Blocks.createBlock(document, { name, cells: [[cell]] });
  element.replaceWith(block);
}
