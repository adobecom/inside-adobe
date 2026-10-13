/* eslint-disable */
/* global WebImporter */
/**
 * Parser for related-cards (Cards convention): after the block-name row, one row per card:
 *   cell 1: the card image   cell 2: H3 title linked to the card's target, then the description
 * Source: the .related tiles inside `element` (a band or section). The intranet stacks them in
 * columns, so they're ordered as they appear on screen (top to bottom, then left to right).
 * The block takes the place of the first card's outermost container that holds no other text.
 */
export default function parse(element, { document }) {
  const cards = [...element.querySelectorAll('.related')].filter((c) => c.querySelector('a.related-content-link'));
  if (!cards.length) return;
  const pos = (c) => c.getBoundingClientRect();
  cards.sort((a, b) => (Math.abs(pos(a).top - pos(b).top) > 4 ? pos(a).top - pos(b).top : pos(a).left - pos(b).left));

  const cells = cards.map((card) => {
    const link = card.querySelector('a.related-content-link');
    const bg = card.querySelector('[style*="background-image"]')?.getAttribute('style').match(/url\(['"]?([^'")]+)/);
    const img = bg ? Object.assign(document.createElement('img'), { src: bg[1], alt: '' }) : '';
    const h3 = document.createElement('h3');
    const a = document.createElement('a');
    a.href = link.getAttribute('href');
    if (link.getAttribute('target') === '_blank') a.target = '_blank';
    a.textContent = card.querySelector('.related-content-title')?.textContent.trim() || link.textContent.trim();
    h3.append(a);
    const text = [h3];
    const desc = card.querySelector('.related-content-description')?.textContent.trim();
    if (desc) text.push(Object.assign(document.createElement('p'), { textContent: desc }));
    return [img, text];
  });

  // climb from the first card while the container holds only cards (not the group's heading)
  let anchor = cards[0];
  while (anchor.parentElement && anchor.parentElement !== element && !anchor.parentElement.querySelector('.cmp-text, h1, h2')) {
    anchor = anchor.parentElement;
  }
  anchor.before(WebImporter.Blocks.createBlock(document, { name: 'related-cards', cells }));
  cards.forEach((c) => c.remove());
}
