export default function init(el) {
  for (const row of el.children) {
    row.classList.add('row');
    for (const col of row.children) {
      const isImage = col.querySelector('picture') && !col.textContent.trim();
      col.classList.add('col', isImage ? 'col-image' : 'col-text');
    }
  }
}
