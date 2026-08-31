# Spanish — and NOBODY WHO SPEAKS IT HAS READ ANY OF THIS

> **No Spanish speaker, clinical or otherwise, has reviewed a single string in this directory.** That
> includes the clinical screens: medication names, allergy warnings, case notes and the onboarding
> questions about your health. It was translated carefully and by one non-native process, which is not the
> same thing and is not a substitute for review.
>
> **Why that matters more now than it did on 2026-08-30.** Until the clinical bundles landed, a Spanish
> reader meeting an untranslated screen saw English and could tell the translation was missing. Confident
> Spanish removes that signal: there is nothing on screen to distinguish a reviewed string from an
> unreviewed one. The per-key fallback that makes partial bundles safe is exactly what made filling them in
> a decision rather than a chore, and it was taken deliberately on 2026-08-31 rather than by drift.
>
> A Spanish-speaking clinician reading `patientPortal.json` — particularly `status`, `medications`,
> `allergies` and `onboarding.field` — is the outstanding work.


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

## What is done, third tranche (2026-08-31)

The portal's **chrome** — `brand`, `nav`, `action`, `pager`, `filter`, `actingAs`. 50 keys, taking
`patientPortal` from 30 of 446 to 84.

**Chosen because it is the largest block that carries no clinical claim.** These are navigation labels,
buttons, pagination and the acting-as banner: a wrong word here is an awkward label, not a clinical error,
which is the line the section below draws. (This tranche left the clinical bundles untouched; the fourth,
later the same day, did not — see below.)

Terminology follows the warning below rather than the dictionary, and the two that matter here are
`nav.emergencies` → **Urgencias**, not _Emergencias_, and `nav.record` → **Mi historial**, matching the
`deleteAccount` tranche's _"Sí, eliminar mi historial"_ rather than introducing a second word for the same
thing. Register is formal (_usted_) throughout, again matching what was already here.

`actingAs` is in this tranche despite being chrome, and is the one part of it worth a careful read.
**The banner is a safety control**, not decoration: every screen behind it shows a record that is not the
signed-in person's, and the failure it prevents is somebody reading a blood group believing it is their own.
_"Está viendo el historial de {{name}}"_ has to be unambiguous at a glance.

Checked mechanically, because both of these fail silently: **no key exists in `es` that does not exist in
`en`** (it would render for nobody and never be missed), and **every `{{placeholder}}` survives translation**
(a lost one renders the literal `{{name}}` to a patient).

## What is done, fourth tranche (2026-08-31) — the clinical screens

**`patientPortal.json` is now complete: 446 of 446 keys.** The remaining 362 went in one pass, on an explicit
decision to ship them unreviewed rather than wait — see the warning at the top of this file, which is the
cost of that decision and not a disclaimer.

Terminology follows the rules below rather than the dictionary. The ones that bite hardest here:
**afección** not _condición_ (`allergies.conditions`, `onboarding.field.conditions`), **urgencias** not
_emergencias_ (`title`, `overview.tile`, `emergencies.*`), and _stat_ meaning a vital sign — rendered
**constantes vitales** and **mediciones**, never anything implying urgency.

Register and vocabulary follow the three earlier tranches rather than starting again: formal _usted_,
**historial** for record, **ángel de cuidado** for care angel, **en nombre de** for acting on somebody's
behalf, **equipo de atención** for care team.

Checked mechanically, because all three fail silently: **446/446 coverage**, **no key in `es` that does not
exist in `en`**, and **every `{{placeholder}}` preserved** — including the mixed `{{ name }}` and `{{count}}`
spacings, which differ between keys and had to be matched individually. Three strings are identical to
English on purpose: `brand.suffix` (BridgeCare), `auth.stat.careLineValue` (24/7) and
`profile.field.plan` (_Plan_ is the same word).

## What is done, fifth tranche (2026-08-31) — everything else

**All 48 bundles now exist. There are no untranslated files left.** The remaining 40 in one pass: 11 enum
bundles, 20 generated entity bundles, and 9 JHipster admin screens.

**The entity bundles were generated from a shared dictionary rather than translated file by file, and that was
the safer choice, not the lazy one.** 109 distinct field labels repeat across 20 files — `Created Date`,
`Patient Id`, `Modified By` and so on. Translating them by hand is precisely how the same field comes to
render two different ways in two screens. The generator asserts that every English string is covered rather
than passing unknown ones through silently.

**Two things found while doing it, both recorded rather than smoothed over.**

The English enum bundles are *themselves* untranslated: `en/patientMS-allergySeverity.json` maps `"MILD"` to
the literal `"MILD"`, so an English-speaking administrator reads `WITHHELD` and `SEVERE` today. After this,
**Spanish reads better than English on those screens**, which is an odd state for a product and is worth a
decision rather than a discovery. The same is true of `health.status.*` (`UP`, `DOWN`).

And in three entity bundles — `ActivityLog`, `CarePlanItem`, `Emergency` — `detail` is a plain field *label*,
not the `{title: …}` object every other bundle has. Treating them alike dropped the label and invented a key
nothing reads. The verification caught it; a spot check would not have.

**Where the enum bundles deliberately differ from the portal.** `patientPortal.status` renders some constants
in patient-facing language — `ACTIVE` as *Tomando ahora*, `HIGH` as *Urgente* — while the enum bundles are the
administrator's raw view and use *Activo* and *Alta*. English makes the same distinction; the Spanish mirrors
it rather than flattening it.

Checked across all 48: **zero missing keys, zero orphans, zero placeholder mismatches, every file valid JSON.**
`es` is declared in `webpack.custom.js` as a glob over this directory, so new files here are picked up with no
build change — the trap noted below applies to adding a *locale*, not a file.

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
