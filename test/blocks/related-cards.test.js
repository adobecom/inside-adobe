import { expect } from '@esm-bundle/chai';
import init from '../../blocks/related-cards/related-cards.js';

describe('related-cards', () => {
  it('turns each row into a tile linking to its title link', () => {
    const el = document.createElement('div');
    el.innerHTML = `<div><div><picture><img src="/a.png" alt=""></picture></div>
      <div><h3><a href="/adobe-events/max">Adobe MAX</a></h3><p>The creativity conference.</p></div></div>
      <div><div></div><div><h3><a href="https://example.com/" target="_blank">Elsewhere</a></h3></div></div>`;
    init(el);
    const tiles = el.querySelectorAll('li > a');
    expect(tiles.length).to.equal(2);
    expect(tiles[0].getAttribute('href')).to.equal('/adobe-events/max');
    expect(tiles[0].querySelector('picture')).to.exist;
    expect(tiles[0].querySelector('h3').textContent).to.equal('Adobe MAX');
    expect(tiles[0].querySelector('h3 a')).to.be.null;
    expect(tiles[1].target).to.equal('_blank');
  });
});
