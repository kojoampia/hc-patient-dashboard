import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { IconComponent } from 'app/shared/ui/icon/icon.component';
import { ActingAsService } from 'app/core/auth/acting-as.service';

import { DeletionRequest, DeletionRequestService, PRIVACY_POLICY_URL } from '../data/deletion-request.service';
import { formatInstantDay } from '../data/portal-format';

type State = 'loading' | 'ready' | 'failed';

/**
 * Asking for this record to be erased.
 *
 * <p>Parity with hc-patient-app's screen of the same name, which came first — the mobile app needed
 * it for Google Play's account-deletion requirement, and a patient who uses both clients should
 * find the same thing in both. Same three endpoints, same translation keys, same two-step confirm.</p>
 *
 * <h2>It asks; it does not do</h2>
 *
 * <p>The portal has no delete affordance anywhere and this is not one. The patient service reserves
 * erasure to {@code ROLE_ADMIN}: this screen records a request, shows the date it is owed by, and
 * lets the patient take it back before then.</p>
 *
 * <h2>The two-step confirm</h2>
 *
 * <p>The first action reveals what would go and requires a second, differently worded one. On the
 * web that matters slightly less than on a phone — there is no mis-tap — but the two clients
 * behaving differently about an irreversible request is worse than either choice on its own.</p>
 */
@Component({
  selector: 'hpd-account-deletion',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SharedModule, FormsModule, RouterLink, IconComponent],
  templateUrl: './account-deletion.component.html',
})
export default class AccountDeletionComponent {
  private readonly deletionRequests = inject(DeletionRequestService);
  private readonly actingAs = inject(ActingAsService);

  readonly formatInstantDay = formatInstantDay;
  readonly policyUrl = PRIVACY_POLICY_URL;

  readonly state = signal<State>('loading');
  readonly pending = signal<DeletionRequest | null>(null);

  readonly confirming = signal(false);
  readonly busy = signal(false);
  readonly reason = signal('');

  /** A translation key, never a raw server message. */
  readonly actionError = signal<string | null>(null);

  /**
   * A care angel may not ask for the record they act for to be erased.
   *
   * A delegation exists so decisions can be made when the patient cannot make them; it is not a
   * mandate to end the record. The server refuses it too, so this is the second of two checks —
   * but a screen that offers a control the server will refuse teaches people the app is broken.
   */
  readonly actingForSomeoneElse = this.actingAs.actingForSomeoneElse;

  readonly isLoading = computed(() => this.state() === 'loading');
  readonly isFailed = computed(() => this.state() === 'failed');

  constructor() {
    this.reload();
  }

  reload(): void {
    this.state.set('loading');
    this.deletionRequests.mine().subscribe({
      next: request => {
        this.pending.set(request);
        this.state.set('ready');
      },
      error: () => this.state.set('failed'),
    });
  }

  /** First action: reveal the consequences. Nothing has been asked for yet. */
  startConfirm(): void {
    this.actionError.set(null);
    this.confirming.set(true);
  }

  abandon(): void {
    this.confirming.set(false);
  }

  /** Second action, differently worded. This is the one that starts the clock. */
  confirm(): void {
    if (this.busy()) {
      return;
    }
    this.busy.set(true);
    this.actionError.set(null);

    this.deletionRequests.raise(this.reason()).subscribe({
      next: request => {
        this.pending.set(request);
        this.confirming.set(false);
        this.reason.set('');
        this.busy.set(false);
      },
      error: () => {
        this.actionError.set('patientPortal.deleteAccount.error.raise');
        this.busy.set(false);
      },
    });
  }

  cancelRequest(): void {
    const open = this.pending();
    if (!open || this.busy()) {
      return;
    }
    this.busy.set(true);
    this.actionError.set(null);

    this.deletionRequests.cancel(open.id).subscribe({
      next: () => {
        this.pending.set(null);
        this.busy.set(false);
      },
      error: () => {
        this.actionError.set('patientPortal.deleteAccount.error.cancel');
        this.busy.set(false);
      },
    });
  }
}
