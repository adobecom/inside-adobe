export default function init(el) {
  const inner = el.querySelector(':scope > div > div');
  if (!inner) return;
  inner.classList.add('card-resource-inner');
  const heading = inner.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) inner.prepend(heading);
  inner.querySelector('p:has(> picture)')?.classList.add('card-resource-picture');
}
