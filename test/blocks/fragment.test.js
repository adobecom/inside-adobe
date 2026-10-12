import { expect } from '@esm-bundle/chai';
import { setConfig } from '../../scripts/ak.js';
import init from '../../blocks/fragment/fragment.js';

const FRAGMENT = '<html><body><main><div><p>One</p></div><div><p>Two</p></div></main></body></html>';
const section = (html) => `<div class="section"><div class="default-content">${html}</div></div>`;

describe('fragment', () => {
  const originalFetch = window.fetch;
  let main;

  before(() => setConfig({ hostnames: ['example.com'], locales: { '': {} }, linkBlocks: [{ fragment: '/fragments/' }] }));

  beforeEach(() => {
    window.fetch = async () => new Response(FRAGMENT);
    main = document.createElement('main');
    main.innerHTML = section('<p>Before</p>')
      + section('<p><a href="/fragments/shared/x">/fragments/shared/x</a></p>')
      + section('<p>After</p>');
    document.body.append(main);
  });

  afterEach(() => {
    window.fetch = originalFetch;
    main.remove();
  });

  it('puts the sections of a fragment that fills a section in its place, in order', async () => {
    await init(main.querySelector('a'));
    expect([...main.children].map((s) => s.textContent.trim())).to.deep.equal(['Before', 'One', 'Two', 'After']);
    expect([...main.children].every((s) => s.classList.contains('section'))).to.be.true;
  });

  it('keeps a multi-section fragment wrapped when it shares its section', async () => {
    const extra = document.createElement('p');
    extra.textContent = 'Also here';
    main.querySelector('a').closest('.default-content').append(extra);
    await init(main.querySelector('a'));
    expect(main.querySelector(':scope > .section .fragment-content > .section')).to.exist;
  });
});
