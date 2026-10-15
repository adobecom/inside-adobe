import { expect } from '@esm-bundle/chai';
import {
  DEFAULT_EDITION, getEdition, setEdition, pickVersion, inEdition,
} from '../../scripts/utils/edition.js';

const countries = [
  { href: '/t/uk', tags: ['global/emea/united-kingdom'] },
  { href: '/t/us', tags: ['global/americas/united-states'] },
  { href: '/t/latam', tags: ['global/americas/brazil', 'global/americas/mexico'] },
  { href: '/t/apac', tags: ['global/apac'] },
  { href: '/t/korea', tags: ['global/apac/korea', 'global/apac/korea/seoul'] },
];
const roles = [
  { href: '/t/default', tags: ['employee'] },
  { href: '/t/manager', tags: ['manager'] },
];
const at = (geo, manager = false) => ({ geo, manager });

describe('edition', () => {
  afterEach(() => localStorage.removeItem('edition'));

  it('defaults to United States, and remembers a choice', () => {
    expect(getEdition()).to.deep.equal(DEFAULT_EDITION);
    setEdition({ name: 'London', geo: 'global/emea/united-kingdom/london', manager: true });
    expect(getEdition().name).to.equal('London');
    expect(getEdition().manager).to.be.true;
  });

  it('picks the country version containing the edition', () => {
    expect(pickVersion(countries, at('global/emea/united-kingdom/london')).href).to.equal('/t/uk');
    expect(pickVersion(countries, at(DEFAULT_EDITION.geo)).href).to.equal('/t/us');
    expect(pickVersion(countries, at('global/americas/mexico/remote')).href).to.equal('/t/latam');
  });

  it('prefers the most specific match', () => {
    expect(pickVersion(countries, at('global/apac/korea/seoul')).href).to.equal('/t/korea');
    expect(pickVersion(countries, at('global/apac/singapore')).href).to.equal('/t/apac');
  });

  it('finds nothing for an edition without a version', () => {
    expect(pickVersion(countries, at('global/emea/norway/remote'))).to.be.undefined;
    // tags match whole segments: "global/emea/united" doesn't contain ".../united-kingdom"
    const partial = [{ href: '/x', tags: ['global/emea/united'] }];
    expect(pickVersion(partial, at('global/emea/united-kingdom'))).to.be.undefined;
  });

  it('shows tagged content for its geography and anything inside it', () => {
    const arden = at('global/americas/united-states/arden-hills');
    expect(inEdition(['global'], arden)).to.be.true;
    expect(inEdition(['global/americas/united-states'], arden)).to.be.true;
    expect(inEdition(['global/americas/united-states/arden-hills'], arden)).to.be.true;
    expect(inEdition(['global/americas/united-states/atlanta'], arden)).to.be.false;
    expect(inEdition(['global/emea/france', 'global/americas/united-states'], arden)).to.be.true;
    expect(inEdition([], arden)).to.be.true;
  });

  it('tells the page when the edition changes', () => {
    let seen;
    const listener = (e) => { seen = e.detail.name; };
    window.addEventListener('edition-change', listener);
    setEdition({ name: 'Paris', geo: 'global/emea/france/paris', manager: false });
    window.removeEventListener('edition-change', listener);
    expect(seen).to.equal('Paris');
  });

  it('picks the role version by the manager setting', () => {
    expect(pickVersion(roles, at(DEFAULT_EDITION.geo)).href).to.equal('/t/default');
    expect(pickVersion(roles, at(DEFAULT_EDITION.geo, true)).href).to.equal('/t/manager');
  });
});
