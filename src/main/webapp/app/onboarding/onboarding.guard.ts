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
        map(response => (response.delegations ?? []).length > 0),
        catchError(() => of(false)),
        map(hasDelegations => router.parseUrl(hasDelegations ? '/invitations' : '/onboarding')),
      );
    }),
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

  return onboardingService.status().pipe(map(status => (status.onboarded ? router.parseUrl('/overview') : true)));
};
