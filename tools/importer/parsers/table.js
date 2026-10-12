/* eslint-disable */
/* global WebImporter */
/**
 * Parser for table (Table convention): after the block-name row, each block row is one data row
 * and each cell one data point; the first data row is the header.
 * Source: .table (dexter-Table). Each cell's AEM text wrappers are unwrapped to their paragraphs.
 */
export default function parse(element, { document }) {
  const source = element.querySelector('table');
  if (!source) {
    element.remove();
    return;
  }
  const cells = [...source.querySelectorAll('tr')].map((tr) => [...tr.querySelectorAll(':scope > th, :scope > td')]
    .map((c) => {
      const texts = c.querySelectorAll('.cmp-text');
      return texts.length ? [...texts].flatMap((t) => [...t.children]) : [...c.childNodes];
    }));
  if (!cells.length) {
    element.remove();
    return;
  }
  element.replaceWith(WebImporter.Blocks.createBlock(document, { name: 'table', cells }));
}
