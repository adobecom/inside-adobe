import { expect } from '@esm-bundle/chai';

// Set query param before importing scripts module
const originalUrl = window.location.href;
window.history.pushState({}, '', '?dapreview=true');

// Now import - module will see the dapreview param
await import('../../scripts/scripts.js');

describe('dapreview', () => {
  after(() => {
    window.history.pushState({}, '', originalUrl);
  });

  it('should detect dapreview query parameter', () => {
    const url = new URL(window.location.href);
    const dapreview = url.searchParams.get('dapreview');
    expect(dapreview).to.equal('true');
  });

  it('should load da.js module', async () => {
    // da.js is imported once the page has loaded: slower when the suite runs in parallel
    const daLoaded = () => performance.getEntriesByType('resource')
      .some((r) => r.name.includes('tools/da/da.js'));
    for (let i = 0; i < 50 && !daLoaded(); i += 1) {
      await new Promise((resolve) => { setTimeout(resolve, 100); });
    }
    expect(daLoaded()).to.be.true;
  });
});
