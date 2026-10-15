// The reader's edition (an office or remote location) and role, chosen in the header's edition
// picker and kept in the browser. Topics with country or manager versions open the matching one.
import { ifLocalStorage } from '../ak.js';

const KEY = 'edition';
export const DEFAULT_EDITION = { name: 'United States', geo: 'global/americas/united-states/remote', manager: false };

export function getEdition() {
  try {
    return { ...DEFAULT_EDITION, ...JSON.parse(ifLocalStorage.getItem(KEY)) };
  } catch {
    return DEFAULT_EDITION;
  }
}

export function setEdition(edition) {
  ifLocalStorage.setItem(KEY, JSON.stringify(edition));
  window.dispatchEvent(new CustomEvent('edition-change', { detail: edition }));
}

// content tagged with geographies (e.g. news): for the edition when a tag is its geography or
// contains it ("global" is for everyone); untagged content is for everyone too
export function inEdition(tags, { geo }) {
  return !tags.length || tags.some((tag) => geo === tag || geo.startsWith(`${tag}/`));
}

// versions: [{ href, tags: ['global/emea/france', …] or ['manager'] }]. Country topics: the version
// whose tag contains the edition's geography most specifically. Role topics: manager or the other.
export function pickVersion(versions, { geo, manager }) {
  if (versions.some((v) => v.tags.includes('manager'))) {
    return versions.find((v) => v.tags.includes('manager') === manager);
  }
  let best;
  let depth = 0;
  versions.forEach((v) => v.tags.forEach((tag) => {
    if ((geo === tag || geo.startsWith(`${tag}/`)) && tag.length > depth) {
      best = v;
      depth = tag.length;
    }
  }));
  return best;
}
