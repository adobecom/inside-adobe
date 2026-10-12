/* eslint-disable */
/* global WebImporter */
/**
 * Parser for welcome: the personalized greeting becomes a generic "Welcome" heading;
 * today's date is filled in by the block. One row: heading | More News link (primary button).
 * The More News link lives in the source news grid, so it is moved here.
 */
export default function parse(element, { document }) {
  const h1 = document.createElement('h1');
  h1.textContent = 'Welcome';
  const cells = [[h1]];

  const more = document.querySelector('.more-news-link a');
  if (more) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    const a = document.createElement('a');
    a.href = more.getAttribute('href');
    a.textContent = more.textContent.trim();
    strong.append(a);
    p.append(strong);
    cells[0].push(p);
    more.closest('.more-news-link').remove();
  }
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'welcome', cells }));
}
