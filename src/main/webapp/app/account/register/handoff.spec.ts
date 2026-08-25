import { handoffSource } from './handoff';

/**
 * What the `src` parameter is allowed to become.
 *
 * <p>It arrives as a query parameter — the caller's own text — and lands on a user record a human reads and a
 * report counts. These cases are the boundary between "attribution" and "anybody can write anything into our
 * numbers".</p>
 */
describe('handoffSource', () => {
  it('accepts a surface the contract names', () => {
    expect(handoffSource('web-home')).toBe('web-home');
  });

  it('is null when nobody said', () => {
    expect(handoffSource(null)).toBeNull();
    // Not a default. A defaulted source is a fact nobody stated, indistinguishable in the data from a family who
    // really did arrive that way.
    expect(handoffSource('')).toBeNull();
  });

  it('refuses a surface nobody agreed to, rather than storing it', () => {
    // The cost of the allowlist, stated: a genuinely new surface loses attribution until a line is added here.
    // Silent, and cheaper than un-poisoning a metric.
    expect(handoffSource('web-pricing')).toBeNull();
  });

  it('never returns the caller text, however it is dressed up', () => {
    expect(handoffSource('<script>alert(1)</script>')).toBeNull();
    expect(handoffSource('web-home ')).toBeNull();
    expect(handoffSource('WEB-HOME')).toBeNull();
    expect(handoffSource('web-home;drop')).toBeNull();
  });
});
