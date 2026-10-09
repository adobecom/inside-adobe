import { loadBlock, loadStyle } from './ak.js';

export default async function loadPostLCP() {
  // adobe-clean, applied once body.session is set after LCP
  loadStyle('https://use.typekit.net/toa0oji.css');
  const header = document.querySelector('header');
  if (header) await loadBlock(header);
}
