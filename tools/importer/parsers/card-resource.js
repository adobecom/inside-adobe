/* eslint-disable */
/* global WebImporter */
/**
 * Parser for card-resource. Base: card (custom, no library convention).
 * Source: http://127.0.0.1:8765/adobe-mission-and-plan.html
 * One block per .boxtextandimage: single row, single cell holding the H3 title,
 * the image (href-less wrapper anchor dropped), then the description content.
 */
export default function parse(element, { document }) {
  const title = element.querySelector('h3.image-text-header, .image-text-header, h3');
  const img = element.querySelector('.image-ctr img, img');
  const description = element.querySelector('.image-text-description');

  const cell = [];
  if (title) {
    const h3 = document.createElement('h3');
    h3.textContent = title.textContent.trim();
    cell.push(h3);
  }
  if (img) cell.push(img);
  if (description) cell.push(...description.children);

  if (!cell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[cell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'card-resource', cells });
  element.replaceWith(block);
}
