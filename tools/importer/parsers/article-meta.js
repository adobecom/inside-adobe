/* eslint-disable */
/* global WebImporter */
/**
 * Parser for article-meta: news article tags and publish date.
 *   row 1: collection tag link | topic tag link(s)
 *   row 2: the publish date as shown on the page
 * Source: .articletags (.collection-tag, .primary-tag) and the sibling .articledate.
 */
export default function parse(element, { document }) {
  const link = (a) => {
    const el = document.createElement('a');
    el.href = a.getAttribute('href');
    el.textContent = a.textContent.trim();
    return el;
  };
  const collection = [...element.querySelectorAll('.collection-tag a')].map(link);
  const topics = [...element.querySelectorAll('.primary-tag a')].map(link);
  const date = document.querySelector('.articledate .article-date');

  const cells = [[collection, topics]];
  if (date) {
    cells.push([date.textContent.trim()]);
    date.closest('.articledate').remove();
  }
  const block = WebImporter.Blocks.createBlock(document, { name: 'article-meta', cells });
  element.replaceWith(block);
}
