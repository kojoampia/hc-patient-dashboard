import { ChangeDetectionStrategy, Component } from '@angular/core';

import SharedModule from 'app/shared/shared.module';

/**
 * Hostnames that are not production.
 *
 * <p>`.local` covers the quality box, which is reached as `patient.healthconnect.local` from the LAN; `localhost`
 * and the loopback addresses cover a laptop. Everything else — and in particular `patient.abofonsa.com` — is
 * treated as production, so a hostname nobody anticipated errs towards showing no ribbon rather than towards
 * decorating the live site.</p>
 */
const NON_PRODUCTION_HOST = /(^|\.)localhost$|\.local$|^127\.0\.0\.1$|^\[::1\]$/;

/**
 * The corner ribbon that says you are not on production.
 *
 * <h2>Why it reads the hostname rather than the backend</h2>
 *
 * <p>It used to come from {@code GET /management/info}, which reported the backend's active Spring profiles. That
 * call is gone: an actuator endpoint is not part of this application's API, it publishes the build and the active
 * profiles to anyone who asks, and it answered 401 for a signed-out visitor — which reached the global
 * {@code ErrorHandler} and logged a console error on every load of the sign-in page. Noise in the one place a real
 * error would have to be noticed.</p>
 *
 * <p>The hostname is a weaker signal and the difference is worth stating rather than discovering. The old ribbon
 * marked <em>which Spring profiles are running</em>; this one marks <em>which machine you are looking at</em>. They
 * agree everywhere they are currently used, and they come apart in exactly one case: `dev` or `test` active on the
 * production host would no longer light anything up. That case is guarded elsewhere and deliberately — `deploy.sh`
 * refuses those profiles, and `SPRING_PROFILES_ACTIVE` on the production host is the thing that must never carry
 * them — but this component is no longer part of that defence, and nothing here should be read as though it were.</p>
 */
@Component({
  selector: 'hpd-page-ribbon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (ribbonEnv) {
      <div class="ribbon">
        <a href="" hpdTranslate="global.ribbon.{{ ribbonEnv }}">{{ { dev: 'Development' }[ribbonEnv] || '' }}</a>
      </div>
    }
  `,
  styleUrl: './page-ribbon.component.scss',
  imports: [SharedModule],
})
export default class PageRibbonComponent {
  /**
   * The ribbon's label key, or undefined on production.
   *
   * <p>Still `dev` rather than a new value, so the existing `global.ribbon.dev` key in all three bundles keeps
   * working — the word on screen has not changed, only how it is decided.</p>
   */
  readonly ribbonEnv = NON_PRODUCTION_HOST.test(window.location.hostname) ? 'dev' : undefined;
}
