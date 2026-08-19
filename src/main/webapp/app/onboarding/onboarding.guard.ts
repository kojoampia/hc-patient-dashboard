import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

import { ActingAsService } from 'app/core/auth/acting-as.service';
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
 */
export const onboardingGuard: CanActivateFn = () => {
  const actingAsService = inject(ActingAsService);
  const onboardingService = inject(OnboardingService);
  const careDelegationService = inject(CareDelegationService);
  const router = inject(Router);

  if (actingAsService.actingForSomeoneElse()) {
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
  const actingAsService = inject(ActingAsService);
  const onboardingService = inject(OnboardingService);
  const router = inject(Router);

  // An angel has no business in somebody else's onboarding either.
  if (actingAsService.actingForSomeoneElse()) {
    return router.parseUrl('/overview');
  }

  return onboardingService.status().pipe(map(status => (status.onboarded ? router.parseUrl('/overview') : true)));
};
