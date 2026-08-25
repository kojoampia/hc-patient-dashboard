import { TestBed } from '@angular/core/testing';
import { MissingTranslationHandler, TranslateModule, TranslateService } from '@ngx-translate/core';

import { missingTranslationHandler, translationNotFoundMessage } from './translation.config';

/**
 * What a user sees when their language is missing a key.
 *
 * <p>Nothing asserted this, and the answer is not obvious from the code: {@code MissingTranslationHandlerImpl}
 * returns a literal {@code translation-not-found[key]} marker, which reads like the thing a user would be shown.
 * They are not — {@code translation.module.ts} calls {@code setDefaultLang('en')}, and ngx-translate consults the
 * default language <em>before</em> it ever reaches that handler. The marker is the second fallback, not the
 * first.</p>
 *
 * <p>This matters well beyond tidiness. It is the difference between "a locale may ship incomplete and degrades to
 * English" and "a locale must be complete or it renders debug text at patients", and those imply completely
 * different ways of adding a language to a health record's interface.</p>
 */
describe('translation fallback', () => {
  let translate: TranslateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot({ missingTranslationHandler: { provide: MissingTranslationHandler, useFactory: missingTranslationHandler } })],
    });
    translate = TestBed.inject(TranslateService);
    translate.setTranslation('en', { greeting: 'Hello', only: { in: { english: 'English only' } } });
    translate.setTranslation('de', { greeting: 'Hallo' });
    translate.setDefaultLang('en');
    translate.use('de');
  });

  it('uses the active language when it has the key', () => {
    expect(translate.instant('greeting')).toBe('Hallo');
  });

  it('falls back to English rather than showing the not-found marker', () => {
    // The behaviour the whole incremental-translation question turns on. German lacks this key; the user sees
    // English, not debug text.
    expect(translate.instant('only.in.english')).toBe('English only');
  });

  it('shows the marker only when English is missing the key too', () => {
    // Then, and only then, is there nothing to show -- and the marker is deliberately loud rather than blank,
    // because alert.service and status-label.pipe both detect it to decide their own fallbacks.
    expect(translate.instant('nowhere.at.all')).toBe(`${translationNotFoundMessage}[nowhere.at.all]`);
  });
});
