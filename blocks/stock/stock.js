// Share price from Barchart OnDemand, as on the intranet: one request when the page loads, and
// "Last update" is the reader's time of that request. The API key is authored in the block.
const SERVICE = 'https://ondemand.websol.barchart.com/getQuote.json';

const TEMPLATE = `
  <div class="stock-side">
    <a class="stock-symbol" target="_blank" rel="noopener"></a>
    <span class="stock-info">
      <button type="button" aria-label="Stock Info" aria-describedby="stock-tooltip">
        <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true"><circle cx="7" cy="7" r="7" fill="currentColor"/><text x="7" y="11" fill="#fff" font-family="serif" font-size="11" font-weight="700" text-anchor="middle">i</text></svg>
      </button>
      <span class="stock-tooltip" id="stock-tooltip" role="tooltip">
        <strong>Stock Information</strong>
        ©${new Date().getFullYear()} <a href="https://www.barchart.com/solutions" target="_blank" rel="noopener">Market Data</a>
        hosted by Barchart | <a href="https://shared.websol.barchart.com/privacy.php" target="_blank" rel="noopener">Disclaimer</a>
        <a href="https://us.etrade.com/home" target="_blank" rel="noopener">E*TRADE</a>
      </span>
    </span>
  </div>
  <div class="stock-main">
    <div class="stock-price"><span></span><span class="stock-arrow" role="img"></span><span></span></div>
    <div class="stock-updated">Last update: <span></span></div>
  </div>`;

function updated(date) {
  const day = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return `${day} ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
}

export default async function init(el) {
  const [head, ...rows] = el.children;
  head.className = 'stock-head';
  const config = Object.fromEntries(rows.map((row) => {
    const [key, value] = [...row.children].map((cell) => cell.textContent.trim());
    return [key.toLowerCase(), value];
  }));
  rows.forEach((row) => row.remove());
  const symbol = (config.symbol || 'ADBE').toUpperCase();

  const quote = document.createElement('div');
  quote.className = 'stock-quote';
  quote.innerHTML = TEMPLATE;
  const link = quote.querySelector('.stock-symbol');
  link.href = `https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/`;
  link.textContent = symbol;
  el.append(quote);

  try {
    const params = new URLSearchParams({ apikey: config['api key'] || '', symbols: symbol });
    const { results } = await fetch(`${SERVICE}?${params}`).then((r) => r.json());
    const { lastPrice, netChange } = results[0];
    // like the intranet: a change that rounds to 0.00 counts as up
    const change = netChange.toFixed(2);
    const down = change.startsWith('-');
    el.classList.add(down ? 'stock-down' : 'stock-up');
    const [price, arrow, diff] = quote.querySelector('.stock-price').children;
    price.textContent = `$${lastPrice.toFixed(2)}`;
    arrow.ariaLabel = `Stock price is ${down ? 'down' : 'up'}`;
    diff.textContent = down ? change.slice(1) : change;
    quote.querySelector('.stock-updated span').textContent = updated(new Date());
  } catch {
    quote.querySelector('.stock-main').textContent = 'The stock price is unavailable right now.';
  }
}
