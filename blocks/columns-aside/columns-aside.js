export default function init(el) {
  for (const row of el.children) {
    row.classList.add('row');
    const [main, aside] = row.children;
    main?.classList.add('col', 'col-main');
    aside?.classList.add('col', 'col-aside');
  }
}
