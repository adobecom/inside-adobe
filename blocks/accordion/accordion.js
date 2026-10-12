export default function init(el) {
  const items = [...el.children].map((row) => {
    const [title, panel] = row.children;
    const summary = document.createElement('summary');
    summary.append(...(title.querySelector(':scope > p') ?? title).childNodes);
    panel.classList.add('accordion-panel');
    const details = document.createElement('details');
    details.append(summary, panel);
    row.replaceWith(details);
    return details;
  });

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'accordion-toggle';
  const allOpen = () => items.every((d) => d.open);
  const sync = () => { toggle.textContent = allOpen() ? 'Collapse All' : 'Expand All'; };
  toggle.addEventListener('click', () => {
    const open = !allOpen();
    items.forEach((d) => { d.open = open; });
  });
  items.forEach((d) => d.addEventListener('toggle', sync));
  sync();
  el.prepend(toggle);
}
