import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { ActingAsChoice } from 'app/core/auth/acting-as.service';

/** One delegation as the patient service reports it. */
export interface CareDelegation {
  readonly id: string;
  readonly patientId: string;
  readonly angelEmail: string;
  readonly angelName?: string | null;
  /** Resolved by the backend, because a delegation on its own names the angel and not the patient. */
  readonly patientName?: string | null;
  readonly status: 'STANDBY' | 'AWAITING_COUNTERSIGNATURE' | 'PENDING' | 'ACTIVE' | 'DECLINED' | 'REVOKED';
  readonly grantedAt?: string | null;
  readonly acceptedAt?: string | null;
  readonly revokedAt?: string | null;
  readonly revokedBy?: 'PATIENT' | 'ANGEL' | null;
}

interface MineResponse {
  readonly email: string;
  readonly self: { patientId?: string; firstName?: string; lastName?: string; onboardingStatus?: string };
  readonly delegations: readonly CareDelegation[];
}

/**
 * Who the signed-in person is, and who they may act for.
 *
 * <p>`mine()` is the one call made before anything else, and it has to answer for somebody with no record at all — a
 * care angel who is not themselves a patient is exactly that, so it resolves on the token rather than through the
 * patient scope, which would have nothing to resolve.</p>
 */
@Injectable({ providedIn: 'root' })
export class CareDelegationService {
  private readonly http = inject(HttpClient);
  private readonly applicationConfigService = inject(ApplicationConfigService);

  private readonly url = this.applicationConfigService.getEndpointFor('api/care-delegations', 'hcpatientservice');

  /** Everything this person may open, ready for the picker and the banner. */
  mine(): Observable<readonly ActingAsChoice[]> {
    return this.http.get<MineResponse>(`${this.url}/mine`).pipe(
      map(response => {
        const choices: ActingAsChoice[] = [];
        if (response.self?.patientId) {
          const name = [response.self.firstName, response.self.lastName].filter(Boolean).join(' ').trim();
          choices.push({ patientId: response.self.patientId, name: name || response.email, own: true });
        }
        for (const delegation of response.delegations ?? []) {
          // Only ACTIVE confers anything. A pending nomination or a dormant standby appears on the delegation screen,
          // never in the picker — offering it would present a record the next request would refuse.
          if (delegation.status === 'ACTIVE') {
            // The patient's name, never the angel's: this label is how somebody tells whose record they are
            // about to open, which is the whole thing the banner exists to keep unambiguous.
            choices.push({ patientId: delegation.patientId, name: delegation.patientName ?? delegation.patientId, own: false });
          }
        }
        return choices;
      }),
    );
  }

  /** The delegations over the signed-in patient's own record, for the portal's delegation screen. */
  forCurrentPatient(): Observable<readonly CareDelegation[]> {
    return this.http.get<readonly CareDelegation[]>(this.url);
  }

  accept(id: string): Observable<CareDelegation> {
    return this.http.post<CareDelegation>(`${this.url}/${id}/accept`, {});
  }

  decline(id: string): Observable<CareDelegation> {
    return this.http.post<CareDelegation>(`${this.url}/${id}/decline`, {});
  }

  revoke(id: string): Observable<CareDelegation> {
    return this.http.post<CareDelegation>(`${this.url}/${id}/revoke`, {});
  }
}
