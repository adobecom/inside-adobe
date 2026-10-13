function span(className, text) {
  const el = document.createElement('span');
  if (className) el.className = className;
  if (text) el.textContent = text;
  return el;
}

export default function init(el) {
  const [head, ...rows] = el.children;
  head.className = 'events-head';
  const list = document.createElement('ul');
  list.append(...rows.map((row) => {
    const [date, location, title] = [...row.children];
    const [month, day] = date.textContent.trim().split(/\s+/);
    const link = title.querySelector('a') ?? document.createElement('a');
    const name = title.textContent.trim();
    const when = span('events-date');
    when.append(span('', month), span('', day));
    const what = span('events-info');
    what.append(span('', location.textContent.trim()), span('', name));
    link.replaceChildren(when, what);
    const li = document.createElement('li');
    li.append(link);
    row.remove();
    return li;
  }));
  el.append(list);
}
