/* eslint-disable */
/* global WebImporter */
/**
 * Parser for card-resource. Base: card (custom, no library convention).
 * One block per .boxtextandimage: single row, single cell holding the H3 title,
 * the image and the description content, in source order. An image wrapped in
 * a real link keeps the link; href-less wrapper anchors are dropped.
 */
export default function parse(element, { document }) {
  const title = element.querySelector('h3.image-text-header, .image-text-header, h3');
  const img = element.querySelector('.image-ctr img, img');
  const description = element.querySelector('.image-text-description');

  let heading;
  if (title) {
    heading = document.createElement('h3');
    heading.textContent = title.textContent.trim();
  }
  // read source order before the image is moved into a new link
  const imageFirst = img && title && (img.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING);
  let media = img;
  const link = img?.closest('a[href]');
  if (img && link) {
    media = document.createElement('a');
    media.href = link.getAttribute('href');
    media.append(img);
  }

  const cell = (imageFirst ? [media, heading] : [heading, media]).filter(Boolean);
  if (description) cell.push(...description.children);

  if (!cell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[cell]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'card-resource', cells });
  element.replaceWith(block);
}
