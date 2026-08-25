# Spanish — partial, and safe to be partial

`web.abofonsa.com` advertises `?locale=es` on its handoff link, and this app served three languages, so a
Spanish reader landed in English. This directory closes that, **incrementally**.

## Why incremental is allowed here

`translation.module.ts` calls `setDefaultLang('en')`, and ngx-translate consults the default language *before*
it reaches `MissingTranslationHandlerImpl` — so **a key with no Spanish renders the English string**, not the
`translation-not-found[…]` marker the handler suggests. This is pinned by
`app/config/translation-fallback.spec.ts`, because nothing asserted it and the code reads the other way round.

That is what makes tranches possible. The alternative would be one 1221-key pass, and a health record's
interface should not be translated in a single sweep by anybody, least of all quickly.

## What is done

The account path a family actually walks when they arrive from the landing page: `global`, `register`,
`login`, `activate`, `password`, `reset`, `error`. Roughly 190 keys of 1221.

## What is not

`patientPortal.json` (415 keys) and the `patientMs*` entity bundles — the clinical screens. These are the ones
where a wrong word is a clinical error rather than an awkward sentence, and they are deliberately last.

## Before this is relied on

**A competent Spanish speaker has to read it, and for the clinical bundles that person should be clinical.**
What is here was translated carefully and is not a substitute for that review. The specific risks are the
ordinary ones for health software: *condition* is `afección` and not `condición`; *stat* here means a vital
sign, not something urgent; *emergency* is `urgencia` rather than `emergencia` in most Spanish clinical usage,
and the two are not interchangeable in a triage context.

Nothing about a partial bundle is unsafe. A missing key shows English, which is the status quo for a Spanish
reader today.
