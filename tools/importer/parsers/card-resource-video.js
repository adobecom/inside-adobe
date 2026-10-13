/* eslint-disable */
/* global WebImporter */
/**
 * Parser for card-resource (video): a .thumbnail video card.
 * One cell: thumbnail linked to the video, H3 title, description.
 */
export default function parse(element, { document }) {
  const link = element.querySelector('a.thumbnail-link');
  const img = element.querySelector('img.image-url, img:not(.overlay-image)');
  const title = element.querySelector('.thumbnail-title');
  const description = element.querySelector('.thumbnail-description-container');

  const cell = [];
  if (img) {
    if (link?.getAttribute('href')) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.append(img);
      cell.push(a);
    } else {
      cell.push(img);
    }
  }
  if (title) {
    const h3 = document.createElement('h3');
    h3.textContent = title.textContent.trim();
    cell.push(h3);
  }
  if (description) cell.push(...description.querySelectorAll('p'));

  const block = WebImporter.Blocks.createBlock(document, { name: 'card-resource (video)', cells: [[cell]] });
  element.replaceWith(block);
}
