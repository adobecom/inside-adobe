import { expect } from '@esm-bundle/chai';
import init from '../../blocks/image-modal/image-modal.js';

const block = () => {
  const el = document.createElement('div');
  el.innerHTML = `<div><div><picture><img src="/a.png" alt="Check-in"></picture></div>
      <div><p>Check-in</p><p>(Mar 16 – May 1)</p></div>
      <div><p><strong>Check-in (March 16 – May 1)</strong></p><p>What to expect.</p></div></div>
    <div><div>Glass Film Testing</div><div><p>Testing films.</p></div><div><picture><img src="/b.png" alt=""></picture></div></div>`;
  document.body.append(el);
  init(el);
  return el;
};

describe('image-modal', () => {
  it('turns each row into a tile with title, caption and image', () => {
    const el = block();
    const tiles = el.querySelectorAll('li > .image-modal-tile');
    expect(tiles.length).to.equal(2);
    expect(tiles[0].querySelector('picture')).to.exist;
    expect(tiles[0].querySelector('.image-modal-title').textContent).to.equal('Check-in');
    expect(tiles[0].querySelector('.image-modal-caption').textContent).to.equal('(Mar 16 – May 1)');
    expect(tiles[1].querySelector('.image-modal-title').textContent).to.equal('Glass Film Testing');
    expect(tiles[1].querySelector('.image-modal-caption')).to.be.null;
    el.remove();
  });

  it('opens a dialog with the content, and closes it', () => {
    const el = block();
    const tile = el.querySelector('.image-modal-tile');
    const dialog = document.getElementById(tile.getAttribute('aria-controls'));
    expect(dialog.open).to.be.false;
    tile.click();
    expect(dialog.open).to.be.true;
    expect(dialog.querySelector('.image-modal-heading').textContent).to.equal('Check-in');
    expect(dialog.querySelector('.image-modal-text strong').textContent).to.equal('Check-in (March 16 – May 1)');
    expect(dialog.querySelector('.image-modal-body picture')).to.exist;
    dialog.querySelector('.image-modal-close').click();
    expect(dialog.open).to.be.false;
    el.remove();
  });

  it('puts the image on the right when the image cell is last', () => {
    const el = block();
    const [first, second] = el.querySelectorAll('.image-modal-body');
    expect(first.classList.contains('image-right')).to.be.false;
    expect(second.classList.contains('image-right')).to.be.true;
    el.remove();
  });
});
