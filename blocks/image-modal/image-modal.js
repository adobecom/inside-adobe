// One row per tile: image | title, then a caption (dates) | what the pop-up shows.
// A tile opens a dialog with the title, the image and the content; with the image cell last,
// the image sits on the right of the content.
let count = 0;

function lines(cell) {
  if (!cell) return [];
  const parts = cell.children.length ? [...cell.children] : [cell];
  return parts.map((p) => p.textContent.trim()).filter(Boolean);
}

function dialogFor(id, [title, caption], picture, content, imageRight) {
  const dialog = document.createElement('dialog');
  dialog.className = 'image-modal-dialog';
  dialog.id = id;
  dialog.setAttribute('aria-labelledby', `${id}-title`);
  dialog.innerHTML = `<div class="image-modal-panel">
    <button type="button" class="image-modal-close" aria-label="Close"></button>
    <div class="image-modal-head"><div class="image-modal-heading" id="${id}-title"></div></div>
    <div class="image-modal-body${imageRight ? ' image-right' : ''}"><div class="image-modal-text"></div></div>
  </div>`;
  dialog.querySelector('.image-modal-heading').textContent = title || '';
  if (caption) {
    const p = document.createElement('div');
    p.className = 'image-modal-caption';
    p.textContent = caption;
    dialog.querySelector('.image-modal-head').append(p);
  }
  const body = dialog.querySelector('.image-modal-body');
  if (picture) body.prepend(picture);
  body.querySelector('.image-modal-text').append(...(content?.childNodes || []));
  dialog.querySelector('.image-modal-close').addEventListener('click', () => dialog.close());
  // a click on the overlay (outside the panel) closes it
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  return dialog;
}

export default function init(el) {
  const list = document.createElement('ul');
  [...el.children].forEach((row) => {
    const cells = [...row.children];
    const media = cells.find((c) => c.querySelector('picture'));
    const [label, content] = cells.filter((c) => c !== media);
    const text = lines(label);
    const [title, captionText] = text;
    const picture = media?.querySelector('picture');
    count += 1;
    const id = `image-modal-${count}`;

    const tile = document.createElement('button');
    tile.type = 'button';
    tile.className = 'image-modal-tile';
    tile.setAttribute('aria-haspopup', 'dialog');
    tile.setAttribute('aria-controls', id);
    tile.innerHTML = '<span class="image-modal-label"><span class="image-modal-title"></span></span>';
    tile.querySelector('.image-modal-title').textContent = title || '';
    if (captionText) {
      const caption = document.createElement('span');
      caption.className = 'image-modal-caption';
      caption.textContent = captionText;
      tile.querySelector('.image-modal-label').append(caption);
    }
    if (picture) tile.prepend(picture.cloneNode(true));

    const dialog = dialogFor(id, text, picture, content, cells.at(-1) === media);
    tile.addEventListener('click', () => dialog.showModal());
    const li = document.createElement('li');
    li.append(tile, dialog);
    list.append(li);
  });
  el.replaceChildren(list);
}
