import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { AccountService } from 'app/core/auth/account.service';
import { ActingAsService } from 'app/core/auth/acting-as.service';
import { Authority } from 'app/config/authority.constants';
import { CareDelegationService } from 'app/portal/data/care-delegation.service';
import { OnboardingService } from './onboarding.service';

/**
 * Keeps a patient out of the portal until their record exists.
 *
 * <p>Runs after {@code UserRouteAccessService}, so by the time it is asked the caller is signed in. The question it
 * answers is different: not "may you be here" but "is there anything here yet".</p>
 *
 * <h2>It reads the selected scope, not the token</h2>
 *
 * <p>A care angel acting for a patient must not be sent to onboarding — theirs or anybody's. The patient whose record
 * they have open is onboarded by construction, since a delegation only exists once that patient reached step 2, and
 * the angel may well have no record of their own at all. Checking the caller's own status regardless would trap them
 * in a wizard for a record they are not looking at.</p>
 *
 * <p>So: acting for somebody else — always allow. Acting as yourself — ask the backend.</p>
 *
 * <h2>An administrator is not a patient</h2>
 *
 * <p>The question this guard asks is patient-shaped, and for an administrator every answer to it is wrong. They have
 * no {@code Profile} and are never meant to acquire one, so "no record" is their steady state rather than a stage
 * they are partway through. Sending them to the wizard would ask them to create a patient record for an
 * administrative account — polluting the patient collection with a row representing staff — and the completion guard
 * would then bounce them back the moment they escaped.</p>
 *
 * <p>It also broke more than the landing page. {@code /admin} and {@code /entities} are children of the same
 * shell-parent this guard is attached to, so an administrator was redirected out of the administrative surfaces
 * themselves — the generated CRUD screens are the only place in this app where a patient's record can be corrected,
 * and they were unreachable by the only role permitted to use them.</p>
 */
export const onboardingGuard: CanActivateFn = () => {
  const accountService = inject(AccountService);
  const actingAsService = inject(ActingAsService);
  const onboardingService = inject(OnboardingService);
  const careDelegationService = inject(CareDelegationService);
  const router = inject(Router);

  if (actingAsService.actingForSomeoneElse()) {
    return true;
  }

  // Checked before the backend call rather than after it: the answer does not depend on what the backend says, and an
  // administrator should not be held at a spinner waiting for a status that cannot change the outcome.
  if (accountService.hasAnyAuthority(Authority.ADMIN)) {
    return true;
  }

  return onboardingService.status().pipe(
    switchMap(status => {
      // `onboarded` is the backend's own answer, so the null-means-COMPLETE rule lives in one place rather than being
      // re-derived by every client that asks.
      if (status.onboarded) {
        return of(true as boolean | UrlTree);
      }

      // No record — but that does not always mean "start onboarding". Being a care angel does not make you a patient,
      // and somebody who has been nominated but has not accepted yet holds only a PENDING delegation, which grants
      // nothing and so does not show up as acting for anybody. Sending them to the wizard would ask them to create
      // their own patient record purely to answer somebody else's nomination, and the inverse guard would then keep
      // them there.
      //
      // The extra call only ever runs on the not-onboarded path, which a patient takes once.
      return careDelegationService.mine().pipe(
        map(response => response.delegations.length > 0),
        catchError(() => of(false)),
        map(hasDelegations => router.parseUrl(hasDelegations ? '/invitations' : '/onboarding')),
      );
    }),
    /**
     * <b>This guard must never error, and the reason is not obvious.</b>
     *
     * <p>`canActivate: [UserRouteAccessService, onboardingGuard]` does NOT run in sequence. Angular resolves a
     * route's guards with `prioritizedGuardValue()`: every one of them is subscribed at once, and the answer taken
     * is the first-declared that is not `true`. So this guard fires its request even on loads where the caller is
     * not signed in at all and `UserRouteAccessService` is already on its way to returning false.</p>
     *
     * <p>With an expired token both guards then get a 401 at the same moment. The auth guard handles its own —
     * `identity()` catches and answers null, and it redirects to /login. This one did not, so the 401 from
     * `status()` errored the guard, and an erroring guard aborts the navigation outright: the URL stays where it
     * was, the outlet renders nothing, and the only trace is one line in the console. A blank page, on the portal
     * root, for anyone whose session had simply expired.</p>
     *
     * <p>It presented as intermittent because it is a race — whichever 401 arrives first decides whether the
     * navigation is cancelled cleanly by the auth guard or killed by this one. That also means it was never
     * specific to `/`; every route under the shell had it.</p>
     *
     * <p>`true` rather than a redirect is the right answer to a failure here. This guard is not the authority on
     * whether somebody may be in the portal — `UserRouteAccessService` is, it is declared first, and its `false`
     * outranks this `true`. When the session IS valid and the status call merely failed, letting them through is
     * the same call the mobile fork makes for the same reason: a network blip must not throw a fully onboarded
     * patient at a wizard they do not need.</p>
     */
    catchError(() => of(true as boolean | UrlTree)),
  );
};

/**
 * The other direction, and not optional.
 *
 * <p>Without it, a patient who has finished onboarding and navigates to {@code /onboarding} sits on a wizard they
 * cannot leave, while the guard above sends them back every time they try. Two guards that disagree is a redirect
 * loop, which is exactly the class of defect that passes every unit test and takes the site down.</p>
 */
export const onboardingCompleteGuard: CanActivateFn = () => {
  const accountService = inject(AccountService);
  const actingAsService = inject(ActingAsService);
  const onboardingService = inject(OnboardingService);
  const router = inject(Router);

  // An angel has no business in somebody else's onboarding either.
  if (actingAsService.actingForSomeoneElse()) {
    return router.parseUrl('/overview');
  }

  // And neither has an administrator in their own. Keeping the pair symmetrical is the point: this guard exists
  // because two guards that disagree about who belongs in the wizard is a redirect loop, and a rule added to one
  // without the other is how they come to disagree. Without this, an administrator typing /onboarding is still let
  // in — their status says "not onboarded" and always will — and can create the patient record the guard above now
  // exists to prevent.
  if (accountService.hasAnyAuthority(Authority.ADMIN)) {
    return router.parseUrl('/overview');
  }

  return onboardingService.status().pipe(
    map(status => (status.onboarded ? router.parseUrl('/overview') : true)),
    // Same hazard, same reason — see the note on the guard above. This one guards /onboarding, which carries
    // UserRouteAccessService alongside it and so races it in exactly the same way.
    catchError(() => of(true as boolean | UrlTree)),
  );
};
