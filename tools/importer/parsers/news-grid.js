/* eslint-disable */
/* global WebImporter */
/**
 * Parser for news-grid: the source tiles are a live feed, so the block carries no content;
 * it lists the newest articles from /news/query-index.json at runtime.
 */
export default function parse(element, { document }) {
  const block = WebImporter.Blocks.createBlock(document, { name: 'news-grid', cells: [['']] });
  element.replaceWith(block);
}
