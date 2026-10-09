export default function init(el) {
  for (const row of el.children) {
    row.classList.add('row');
    for (const col of row.children) {
      const link = col.querySelector('a:has(picture)');
      col.classList.add('col', link ? 'col-video' : 'col-text');
      link?.classList.add('video-link');
    }
  }
}
