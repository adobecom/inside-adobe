// One row per card: image | linked title (H3) and description. The whole tile is the link.
export default function init(el) {
  const list = document.createElement('ul');
  [...el.children].forEach((row) => {
    const [media, text] = row.children;
    const link = text?.querySelector('a');
    const li = document.createElement('li');
    const tile = document.createElement('a');
    tile.href = link?.getAttribute('href') || '#';
    if (link?.target) tile.target = link.target;
    const picture = media?.querySelector('picture');
    if (picture) tile.append(picture);
    const body = document.createElement('div');
    body.className = 'related-cards-text';
    if (link) link.replaceWith(...link.childNodes);
    body.append(...(text?.childNodes || []));
    tile.append(body);
    li.append(tile);
    list.append(li);
  });
  el.replaceChildren(list);
}
