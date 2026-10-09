/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-video. Base: columns.
 * Source: http://127.0.0.1:8765/adobe-mission-and-plan.html
 * One row, two cells in source order: text (.cmp-text) and video
 * (link to the video URL wrapping the thumbnail image, then the H3 caption).
 */
export default function parse(element, { document }) {
  const items = element.querySelector('.dexter-FlexContainer-Items') || element;
  const cols = [...items.querySelectorAll(':scope > .text, :scope > .thumbnail')];

  const row = [];
  cols.forEach((col) => {
    if (col.classList.contains('thumbnail')) {
      const srcLink = col.querySelector('a.thumbnail-link, a[href]');
      const img = col.querySelector('img.image-url') || col.querySelector('img:not(.overlay-image)');
      const title = col.querySelector('h3.thumbnail-title, h3, h4');
      const cell = [];
      if (img) {
        const link = document.createElement('a');
        if (srcLink) link.href = srcLink.getAttribute('href');
        link.append(img);
        cell.push(link);
      }
      if (title) {
        title.textContent = title.textContent.trim();
        cell.push(title);
      }
      row.push(cell);
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
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-video', cells });
  element.replaceWith(block);
}
