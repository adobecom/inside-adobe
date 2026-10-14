/* eslint-disable */
/* global WebImporter */
/**
 * Parser for image-modal: a row of the intranet's image pop-up tiles (.imagemodal).
 *   one row per tile: image | title, caption | the pop-up's text
 *   the image cell goes last when the pop-up shows the image on the right (.content.right)
 *   variant (center): the row is centered (dexter-FlexContainer--tabletJustifyCenter)
 * Source: siblings .imagemodal > .image-modal-container (.image-modal-action, .image-modal).
 */
export default function parse(tiles, { document }) {
  const p = (text) => {
    const e = document.createElement('p');
    e.textContent = text;
    return e;
  };
  const cells = tiles.map((tile) => {
    const img = tile.querySelector('.image-modal-action img.image') || tile.querySelector('img');
    const title = tile.querySelector('.image-modal-action .image-modal-header')?.textContent.trim();
    const caption = tile.querySelector('.image-modal-action .image-modal-caption')?.textContent.trim();
    const text = [...tile.querySelectorAll('.image-modal .image-modal-text')].flatMap((t) => [...t.children]);
    const label = [title && p(title), caption && p(caption)].filter(Boolean);
    const media = img ? [img] : [];
    return tile.querySelector('.image-modal .content.right') ? [label, text, media] : [media, label, text];
  });
  const centered = tiles[0].parentElement?.className.includes('JustifyCenter');
  const block = WebImporter.Blocks.createBlock(document, { name: centered ? 'image-modal (center)' : 'image-modal', cells });
  tiles[0].before(block);
  tiles.forEach((t) => t.remove());
  return block;
}
