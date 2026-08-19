import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import SharedModule from 'app/shared/shared.module';
import { ActingAsService } from 'app/core/auth/acting-as.service';
import { CareDelegation, CareDelegationService, toActingAsChoices } from 'app/portal/data/care-delegation.service';

/**
 * Where a nominated care angel answers.
 *
 * <h2>Why it is not in the portal</h2>
 *
 * <p>The person reading this may have no patient record of their own — being an angel does not make you a patient.
 * Inside the portal shell they would meet the onboarding guard, which sees no record, and be asked to create one just
 * to answer somebody else's nomination. So this lives on the signed-out layout behind the signed-in guard, exactly as
 * onboarding does, and is reachable whatever their own state.</p>
 *
 * <h2>Accepting is the moment access begins</h2>
 *
 * <p>Nothing before this grants anything: the nomination has been sitting as a PENDING delegation, which
 * {@code PatientScope} treats as no access at all. That is what makes a mistyped email address recoverable — a
 * stranger who never accepts never gains anything.</p>
 */
@Component({
  selector: 'hpd-invitations',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SharedModule],
  templateUrl: './invitations.component.html',
  styleUrl: './invitations.component.scss',
})
export default class InvitationsComponent {
  private readonly careDelegationService = inject(CareDelegationService);
  private readonly actingAsService = inject(ActingAsService);
  private readonly router = inject(Router);

  private readonly refresh = signal(0);

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  readonly invitations = toSignal(this.careDelegationService.myInvitations(), { initialValue: [] as readonly CareDelegation[] });

  accept(invitation: CareDelegation): void {
    this.act(this.careDelegationService.accept(invitation.id));
  }

  decline(invitation: CareDelegation): void {
    this.act(this.careDelegationService.decline(invitation.id));
  }

  private act(request: ReturnType<CareDelegationService['accept']>): void {
    this.busy.set(true);
    this.error.set(null);
    request.subscribe({
      next: () => {
        // Re-read what they may now open. Accepting has just created the first record this person can reach, and the
        // picker and banner are driven from that list — without this they would land on a portal that still believes
        // they have nothing.
        this.careDelegationService.mine().subscribe({
          next: response => {
            const choices = toActingAsChoices(response);
            this.actingAsService.setAvailable(choices);
            this.busy.set(false);
            void this.router.navigate([choices.length ? '/overview' : '/invitations']);
          },
          error: () => {
            this.busy.set(false);
            this.error.set('patientPortal.invitations.error.failed');
          },
        });
      },
      error: () => {
        this.busy.set(false);
        this.error.set('patientPortal.invitations.error.failed');
      },
    });
  }
}
