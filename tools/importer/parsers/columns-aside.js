/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-aside (Columns convention): first row is the block name,
 * then one row with two cells, side by side as in the source flex container:
 *   cell 1: the main text   cell 2: the boxed note (H3 + note content)
 * The boxed note is plain inline content in its cell; no nested block.
 */
export default function parse(element, { document }) {
  const box = element.querySelector('.boxtextandimage');
  const text = [...element.querySelectorAll('.cmp-text')].find((c) => !c.closest('.boxtextandimage'));

  const main = text ? [...text.children] : [];
  const aside = [];
  if (box) {
    const title = box.querySelector('.image-text-header, h3');
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title.textContent.trim();
      aside.push(h3);
    }
    const description = box.querySelector('.image-text-description');
    if (description) aside.push(...description.children);
  }

  if (!main.length && !aside.length) {
    element.replaceWith(...element.childNodes);
    return;
  }
  const cells = [[main, aside]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-aside', cells });
  element.replaceWith(block);
}
