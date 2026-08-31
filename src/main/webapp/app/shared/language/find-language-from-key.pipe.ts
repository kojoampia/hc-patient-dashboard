import { Pipe, PipeTransform } from '@angular/core';

/**
 * The display name of a locale, for the language picker in account settings.
 *
 * <p>This map has to stay in step with `LANGUAGES` in `config/language.constants.ts`, and nothing used to make
 * it. When `es` was added there on 2026-08-25 it was not added here, with two consequences that lasted until
 * 2026-08-31: the settings dropdown rendered an **empty option** — so a Spanish speaker could not select
 * Spanish, or even tell the entry was theirs — and `transform` threw
 * `TypeError: Cannot read properties of undefined (reading 'name')` on every render of that page.</p>
 *
 * <p>Both halves are fixed: `es` is present, and `transform` no longer assumes the key exists.</p>
 */
@Pipe({
  standalone: true,
  name: 'findLanguageFromKey',
})
export default class FindLanguageFromKeyPipe implements PipeTransform {
  // The value type includes `undefined` deliberately. A plain index signature tells TypeScript every lookup
  // succeeds, which is the exact lie that produced the original TypeError: the compiler was satisfied, the
  // linter called the guard below "unnecessary", and the runtime threw. Saying it can miss is what makes the
  // optional chain both necessary and honest.
  private languages: { [key: string]: { name: string; rtl?: boolean } | undefined } = {
    en: { name: 'English' },
    fr: { name: 'Français' },
    de: { name: 'Deutsch' },
    es: { name: 'Español' },
    // jhipster-needle-i18n-language-key-pipe - JHipster will add/remove languages in this object
  };

  /**
   * Falls back to the raw key rather than throwing.
   *
   * <p>A locale added to `LANGUAGES` but not here is a mistake, and `find-language-from-key.pipe.spec.ts`
   * fails for it. But the failure mode at runtime should be an ugly `es` in a dropdown, not a `TypeError`
   * that reaches the global `ErrorHandler` on a page the user is merely visiting. Degrading beats throwing
   * when the thing being rendered is a label.</p>
   */
  transform(lang: string): string {
    return this.languages[lang]?.name ?? lang;
  }
}
