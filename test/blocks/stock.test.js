import { expect } from '@esm-bundle/chai';
import init from '../../blocks/stock/stock.js';

const block = () => {
  const el = document.createElement('div');
  el.className = 'stock';
  el.innerHTML = `<div><div><h2>Stock</h2></div></div>
    <div><div>Symbol</div><div>ADBE</div></div>
    <div><div>API key</div><div>test-key</div></div>`;
  document.body.append(el);
  return el;
};
const quote = (lastPrice, netChange) => ({ status: { code: 200 }, results: [{ symbol: 'ADBE', lastPrice, netChange }] });

describe('stock', () => {
  const { fetch } = window;
  let requested;
  afterEach(() => { window.fetch = fetch; });
  const respond = (body) => {
    window.fetch = async (url) => {
      requested = new URL(url);
      return new Response(JSON.stringify(body));
    };
  };

  it('shows a falling price with the change unsigned', async () => {
    respond(quote(237.5, -4.771));
    const el = block();
    await init(el);
    expect(requested.searchParams.get('apikey')).to.equal('test-key');
    expect(requested.searchParams.get('symbols')).to.equal('ADBE');
    expect(el.classList.contains('stock-down')).to.be.true;
    expect([...el.querySelector('.stock-price').children].map((s) => s.textContent)).to.deep.equal(['$237.50', '', '4.77']);
    expect(el.querySelector('.stock-arrow').ariaLabel).to.equal('Stock price is down');
    expect(el.querySelector('.stock-symbol').href).to.equal('https://finance.yahoo.com/quote/ADBE/');
    expect(el.querySelector('.stock-updated span').textContent).to.match(/^[A-Z][a-z]{2} \d{1,2}, \d{4} \d{1,2}:\d{2}\s[AP]M$/);
    // the key cell isn't left on the page
    expect(el.textContent).not.to.contain('test-key');
    el.remove();
  });

  it('counts an unchanged price as up', async () => {
    respond(quote(240, 0));
    const el = block();
    await init(el);
    expect(el.classList.contains('stock-up')).to.be.true;
    expect(el.querySelector('.stock-price span:last-child').textContent).to.equal('0.00');
    el.remove();
  });

  it('says so when the quote can\'t be loaded', async () => {
    window.fetch = async () => new Response('API key is missing or not valid.', { status: 401 });
    const el = block();
    await init(el);
    expect(el.querySelector('.stock-main').textContent).to.equal('The stock price is unavailable right now.');
    expect(el.querySelector('.stock-symbol').textContent).to.equal('ADBE');
    el.remove();
  });
});
