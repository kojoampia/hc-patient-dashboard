# Spanish — partial, and safe to be partial

`web.abofonsa.com` advertises `?locale=es` on its handoff link, and this app served three languages, so a
Spanish reader landed in English. This directory closes that, **incrementally**.

## Why incremental is allowed here

`translation.module.ts` calls `setDefaultLang('en')`, and ngx-translate consults the default language _before_
it reaches `MissingTranslationHandlerImpl` — so **a key with no Spanish renders the English string**, not the
`translation-not-found[…]` marker the handler suggests. This is pinned by
`app/config/translation-fallback.spec.ts`, because nothing asserted it and the code reads the other way round.

That is what makes tranches possible. The alternative would be one 1221-key pass, and a health record's
interface should not be translated in a single sweep by anybody, least of all quickly.

## What is done

The account path a family actually walks when they arrive from the landing page: `global`, `register`,
`login`, `activate`, `password`, `reset`, `error`. Roughly 190 keys of 1221.

## What is done, second tranche (2026-08-31)

`patientPortal.deleteAccount.*` — 30 keys, and **this is the first time a bundle here is partial from within
rather than absent entirely.** That is safe for the same reason the tranches are: ngx-translate falls back per
_key_, not per file, so the other ~385 `patientPortal` keys still render English. Verified by comparing the
flattened key sets, and by checking the `{{date}}` placeholders survived translation — a placeholder lost in
translation renders the literal `{{date}}` to a patient reading a deletion deadline.

**Out of tranche order on purpose.** `deleteAccount` is not a clinical screen: it is an account and legal
surface, and it is the one irreversible action a patient can start. `mobile/PARITY.md` flagged it on
2026-08-25 as worth closing ahead of the clinical bundles it was queued behind, and that reasoning holds —
somebody deleting a health record should not be reading the confirmation in a language they did not choose.

Terminology follows the warning below rather than the dictionary: _afecciones_, not _condiciones_.

## What is not

The rest of `patientPortal.json` (~385 keys) and the `patientMs*` entity bundles — the clinical screens. These are the ones
where a wrong word is a clinical error rather than an awkward sentence, and they are deliberately last.

## Before this is relied on

**A competent Spanish speaker has to read it, and for the clinical bundles that person should be clinical.**
That includes the `deleteAccount` tranche above: it is not clinical, but it is irreversible, and _"Sí, eliminar
mi historial"_ is a button somebody presses once.
What is here was translated carefully and is not a substitute for that review. The specific risks are the
ordinary ones for health software: _condition_ is `afección` and not `condición`; _stat_ here means a vital
sign, not something urgent; _emergency_ is `urgencia` rather than `emergencia` in most Spanish clinical usage,
and the two are not interchangeable in a triage context.

Nothing about a partial bundle is unsafe. A missing key shows English, which is the status quo for a Spanish
reader today.
