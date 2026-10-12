/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cta: .calltoaction box with title, text and a Spectrum CTA button.
 * The button becomes a bold link (a primary button in Author Kit).
 */
export default function parse(element, { document }) {
  const box = element.querySelector('.call-to-action-ctr') || element;
  const title = box.querySelector('.call-to-action-title');
  const button = box.querySelector('a.spectrum-Button, a[class*="Button"]');

  const cell = [];
  if (title) {
    const h3 = document.createElement('h3');
    h3.textContent = title.textContent.trim();
    cell.push(h3);
  }
  box.querySelectorAll('p').forEach((p) => { if (!p.contains(button)) cell.push(p); });
  if (button) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    const a = document.createElement('a');
    a.href = button.getAttribute('href');
    a.textContent = button.textContent.trim();
    strong.append(a);
    p.append(strong);
    cell.push(p);
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'cta', cells: [[cell]] });
  element.replaceWith(block);
}
