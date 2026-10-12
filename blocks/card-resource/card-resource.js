export default function init(el) {
  const inner = el.querySelector(':scope > div > div');
  if (!inner) return;
  inner.classList.add('card-resource-inner');
  inner.querySelector('p:has(picture)')?.classList.add('card-resource-picture');
}
