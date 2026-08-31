import { LANGUAGES } from 'app/config/language.constants';
import FindLanguageFromKeyPipe from './find-language-from-key.pipe';

/**
 * Keeps `LANGUAGES` and the pipe's name map in step.
 *
 * <p>Nothing did, and the gap was live for six days. `es` was added to `LANGUAGES` on 2026-08-25 without a
 * matching entry here, which meant the account-settings language picker rendered an <b>empty option</b> —
 * a Spanish speaker could not select Spanish, or even tell the blank entry was theirs — while the pipe threw
 * `TypeError: Cannot read properties of undefined (reading 'name')` on every render of the page.</p>
 *
 * <p><b>Neither symptom failed a build.</b> No unit test exercised the pipe, and the exception surfaced only
 * in a browser console. It was found by loading the settings page on the quality stack while checking
 * something else — which is exactly the class of defect that stack exists for, and exactly why "load the page
 * in a real browser" is the last step of a deploy here.</p>
 */
describe('FindLanguageFromKeyPipe', () => {
  const pipe = new FindLanguageFromKeyPipe();

  it('names every language offered in LANGUAGES', () => {
    // The assertion that would have caught the original bug. A locale a user can pick must have a name to
    // pick it BY; an unnamed one is an empty row in a dropdown.
    const unnamed = LANGUAGES.filter(key => pipe.transform(key) === key);
    expect(unnamed).toEqual([]);
  });

  it('gives the expected display names', () => {
    expect(pipe.transform('en')).toBe('English');
    expect(pipe.transform('fr')).toBe('Français');
    expect(pipe.transform('de')).toBe('Deutsch');
    expect(pipe.transform('es')).toBe('Español');
  });

  it('falls back to the key instead of throwing on an unknown language', () => {
    // Degrading beats throwing when the thing being rendered is a label. The test above is what makes the
    // mistake loud; this is what stops it reaching the global ErrorHandler if it ever happens again.
    expect(() => pipe.transform('xx')).not.toThrow();
    expect(pipe.transform('xx')).toBe('xx');
  });

  it('does not throw on a missing or empty key', () => {
    expect(() => pipe.transform('')).not.toThrow();
    expect(() => pipe.transform(undefined as unknown as string)).not.toThrow();
  });
});
