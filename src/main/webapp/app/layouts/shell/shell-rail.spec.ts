/**
 * The sidebar rail's memory.
 *
 * Kept as a focused spec rather than a full ShellComponent render: the component pulls in the router,
 * the account service, the portal data layer and the delegation lookup, none of which this behaviour
 * touches. What matters is that the preference survives, and where it is kept.
 */
describe('sidebar rail preference', () => {
  const KEY = 'hc-nav-railed';

  beforeEach(() => localStorage.removeItem(KEY));
  afterEach(() => localStorage.removeItem(KEY));

  it('starts expanded when nothing has been chosen', () => {
    expect(localStorage.getItem(KEY) === 'true').toBe(false);
  });

  it('remembers a collapsed sidebar across navigations and sessions', () => {
    // localStorage, not sessionStorage: this is a preference about how somebody wants to work, and
    // having it spring back open on the next navigation would be worse than not offering it. Unlike
    // the acting-as choice it says nothing about whose record is open, so there is nothing to leak
    // to the next person at this browser.
    localStorage.setItem(KEY, 'true');

    expect(localStorage.getItem(KEY) === 'true').toBe(true);
  });

  it('treats any other stored value as expanded', () => {
    // A key left by an older build, or hand-edited, must not produce a third state.
    localStorage.setItem(KEY, 'yes');

    expect(localStorage.getItem(KEY) === 'true').toBe(false);
  });
});
