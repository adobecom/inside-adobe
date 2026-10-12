/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-aside (Columns convention): first row is the block name,
 * then one row with two cells, side by side as in the source flex container:
 *   cell 1: the main text (every text item, in order)
 *   cell 2: the aside (every other item, in order), as plain inline content (no nested block):
 *     boxed note (.boxtextandimage): H3 + note content
 *     video card (.thumbnail): linked thumbnail image, H3 title, description
 *     image (.image): the picture, linked if the source links it
 *     call to action (.calltoaction): H3, text, and the button as a bold link
 *     shared fragment link (/fragments/...), loaded in place by the fragment block
 */
const ASIDE = '.boxtextandimage, .thumbnail, .image, .calltoaction';

function asideContent(item, document) {
  const out = [];
  const title = item.querySelector('.image-text-header, .thumbnail-title, .call-to-action-title, h3');
  const img = item.querySelector('img.image-url, .image-ctr img, img:not(.overlay-image)');
  const link = img?.closest('a[href]');
  if (img && !item.matches('.boxtextandimage, .calltoaction')) {
    const p = document.createElement('p');
    if (link) {
      const a = document.createElement('a');
      a.href = link.getAttribute('href');
      a.append(img);
      p.append(a);
    } else {
      p.append(img);
    }
    out.push(p);
  }
  if (title) {
    const h3 = document.createElement('h3');
    h3.textContent = title.textContent.trim();
    out.push(h3);
  }
  const description = item.querySelector('.image-text-description, .thumbnail-description-container, .call-to-action-desc');
  if (description) out.push(...[...description.children].filter((c) => !c.matches('h3, .thumbnail-title') && c.textContent.trim()));
  const button = item.querySelector('a.spectrum-Button');
  if (button) {
    const p = document.createElement('p');
    const strong = document.createElement('strong');
    const a = document.createElement('a');
    a.href = button.getAttribute('href');
    a.textContent = button.textContent.trim();
    strong.append(a);
    p.append(strong);
    out.push(p);
  }
  return out;
}

// every text item and aside, in order, however deeply the flex containers nest
const ITEM = `.text, ${ASIDE}, p:has(> a[href^="/fragments/"])`;

export default function parse(element, { document }) {
  const main = [];
  const side = [];
  [...element.querySelectorAll(ITEM)].filter((el) => !el.parentElement.closest(ITEM)).forEach((item) => {
    if (item.matches(ASIDE)) side.push(...asideContent(item, document));
    else if (item.matches('p')) side.push(item);
    else item.querySelectorAll('.cmp-text').forEach((t) => main.push(...t.children));
  });

  if (!main.length && !side.length) {
    element.replaceWith(...element.childNodes);
    return;
  }
  const cells = [[main, side]];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-aside', cells });
  element.replaceWith(block);
}
