/* eslint-disable */
/* global WebImporter */
/**
 * Parser for quote: .pullquote. One cell: the quote paragraph, then the attribution
 * (name and title) as its own paragraph. The quote icon is drawn by the block.
 */
export default function parse(element, { document }) {
  const quote = element.querySelector('blockquote');
  const footer = quote?.querySelector('footer');
  const attribution = footer ? [...footer.children].map((c) => c.textContent.trim()).filter(Boolean).join(', ') : '';
  footer?.remove();
  const cell = [];
  const text = document.createElement('p');
  text.textContent = quote ? quote.textContent.trim() : element.textContent.trim();
  cell.push(text);
  if (attribution) {
    const p = document.createElement('p');
    p.textContent = attribution;
    cell.push(p);
  }
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'quote', cells: [[cell]] }));
}
