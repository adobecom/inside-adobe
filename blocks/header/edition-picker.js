import { loadStyle } from '../../scripts/ak.js';
import { getEdition, setEdition } from '../../scripts/utils/edition.js';

// "Change Your Edition" dialog, as on the intranet. The locations and the topics that have country
// or manager versions come from the /editions sheet (sheets "locations" and "topics").
let dialog;
let topics = [];

// on a topic or one of its versions, reopen the topic: it picks the version for the new edition
function reopenTopic() {
  const path = window.location.pathname.replace(/\/$/, '');
  const topic = topics.find((t) => path === t || path.startsWith(`${t}/`));
  if (topic) window.location.href = topic;
}

function list(locations, current, choose) {
  const ul = document.createElement('ul');
  locations.forEach((loc) => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = loc.Name;
    if (loc.Name === current) li.className = 'current-edition';
    btn.addEventListener('click', () => choose(loc));
    li.append(btn);
    ul.append(li);
  });
  return ul;
}

async function build(label) {
  const [resp] = await Promise.all([
    fetch('/editions.json?sheet=locations&sheet=topics').catch(() => null),
    loadStyle(new URL('./edition-picker.css', import.meta.url).href),
  ]);
  const json = resp?.ok ? await resp.json() : {};
  const locations = json.locations?.data || [];
  topics = (json.topics?.data || []).map((r) => r.Topic);
  const edition = getEdition();

  dialog = document.createElement('dialog');
  dialog.className = 'edition-picker';
  dialog.setAttribute('aria-labelledby', 'edition-picker-title');
  dialog.innerHTML = `<div class="edition-picker-panel">
    <button type="button" class="edition-picker-close" aria-label="Close"></button>
    <div class="edition-picker-head">
      <h2 id="edition-picker-title">Change Your Edition</h2>
      <a href="/adobe-offices/office-directory">View All Office Locations</a>
    </div>
    <p class="edition-picker-desc">Changing an edition will alter the localized content and/or language displayed on Inside Adobe.</p>
    <label class="edition-picker-manager"><input type="checkbox"> I'm a people manager</label>
  </div>`;
  const panel = dialog.querySelector('.edition-picker-panel');
  const manager = dialog.querySelector('input');
  manager.checked = edition.manager;
  manager.addEventListener('change', () => {
    setEdition({ ...getEdition(), manager: manager.checked });
    reopenTopic();
  });

  const choose = (loc) => {
    setEdition({ name: loc.Name, geo: loc.Geography.replace(/^geography:/, ''), manager: manager.checked });
    label.textContent = loc.Name;
    dialog.close();
    reopenTopic();
  };
  if (!locations.length) {
    panel.insertAdjacentHTML('beforeend', '<p class="edition-picker-error">The list of editions couldn\'t be loaded.</p>');
  }
  [['office', 'Adobe Offices Worldwide'], ['remote', 'Remote Worker Locations']].forEach(([group, title]) => {
    const items = locations.filter((l) => l.Group === group);
    if (!items.length) return;
    const details = document.createElement('details');
    details.open = items.some((l) => l.Name === edition.name);
    details.innerHTML = `<summary>${title}</summary>`;
    details.append(list(items, edition.name, choose));
    panel.append(details);
  });

  dialog.querySelector('.edition-picker-close').addEventListener('click', () => dialog.close());
  // a click on the overlay (outside the panel) closes it
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  document.body.append(dialog);
}

export default async function openPicker(link, label) {
  if (!dialog) await build(label);
  dialog.showModal();
  dialog.querySelector('.current-edition button, .edition-picker-close')?.focus();
}
