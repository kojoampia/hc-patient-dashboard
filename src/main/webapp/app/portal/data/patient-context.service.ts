import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, ReplaySubject, catchError, map, of, shareReplay, switchMap } from 'rxjs';

import { ApplicationConfigService } from 'app/core/config/application-config.service';
import { AccountService } from 'app/core/auth/account.service';
import { IProfile } from 'app/entities/patientMS/profile/profile.model';
import { IProfessional } from 'app/entities/patientMS/professional/professional.model';
import { ProfessionalService } from 'app/entities/patientMS/professional/service/professional.service';

/** A care-team member, resolved to something a template can render directly. */
export interface CareTeamMember {
  readonly id: string;
  readonly name: string;
  readonly role: string;
  readonly initials: string;
  readonly location: string;
  readonly imageUrl: string | null;
}

/** The stand-in used when a record references a professional the care team list does not have. */
const UNKNOWN_MEMBER: CareTeamMember = {
  id: '',
  name: 'Care team',
  role: 'Abofonsa BridgeCare',
  initials: 'AB',
  location: '',
  imageUrl: null,
};

/**
 * Answers the two questions every portal screen starts with: *which patient is this*, and *who
 * are the people named on their records*.
 *
 * Both answers are fetched once per session and shared — a dozen screens asking independently
 * would otherwise mean a dozen identical round trips. Callers that need fresh data after a write
 * call {@link reload}.
 */
@Injectable({ providedIn: 'root' })
export class PatientContextService {
  private readonly http = inject(HttpClient);
  private readonly applicationConfigService = inject(ApplicationConfigService);
  private readonly accountService = inject(AccountService);
  private readonly professionalService = inject(ProfessionalService);

  private readonly profileUrl = this.applicationConfigService.getEndpointFor('api/profiles', 'hcpatientservice');

  /** Bumped by reload() to re-run the shared pipelines below. */
  private readonly refresh$ = new ReplaySubject<void>(1);

  readonly profile$: Observable<IProfile | null> = this.refresh$.pipe(
    switchMap(() => this.accountService.identity()),
    switchMap(account => {
      if (!account?.email) {
        return of(null);
      }
      return this.http.get<IProfile>(`${this.profileUrl}/email/${encodeURIComponent(account.email)}`).pipe(
        // A signed-in user with no profile document yet is a normal state, not an error: the
        // screens fall back to their empty state rather than showing a failure.
        catchError(() => of(null)),
      );
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  /**
   * The id every other collection is filtered by. Falls back to the profile's own id, because
   * older profile documents were written before `patientId` existed.
   */
  readonly patientId$: Observable<string | null> = this.profile$.pipe(map(profile => profile?.patientId ?? profile?.id ?? null));

  readonly careTeam$: Observable<readonly CareTeamMember[]> = this.refresh$.pipe(
    switchMap(() => this.professionalService.query()),
    map(response => (response.body ?? []).map(professional => toMember(professional))),
    catchError(() => of([] as CareTeamMember[])),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  /** Care team indexed by id, for resolving the professional named on a case, visit or report. */
  readonly careTeamById$: Observable<ReadonlyMap<string, CareTeamMember>> = this.careTeam$.pipe(
    map(members => new Map(members.map(member => [member.id, member]))),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  constructor() {
    this.refresh$.next();
  }

  /** Resolves a professional id against the care team, never returning null. */
  static memberOf(byId: ReadonlyMap<string, CareTeamMember>, id: string | null | undefined): CareTeamMember {
    return (id ? byId.get(id) : undefined) ?? UNKNOWN_MEMBER;
  }

  /** Re-fetches the profile and care team. Call after a write that changes either. */
  reload(): void {
    this.refresh$.next();
  }
}

function toMember(professional: IProfessional): CareTeamMember {
  const name = [professional.firstName, professional.lastName].filter(Boolean).join(' ').trim();
  return {
    id: professional.id,
    name: name || 'Care team',
    role: professional.role ?? professional.specialty ?? '',
    initials: professional.initials ?? initialsOf(name),
    location: professional.location ?? '',
    imageUrl: professional.imageUrl ?? null,
  };
}

/** "Dr. Grace Mensah" -> "GM". The honorific is dropped so it does not become the initial. */
function initialsOf(name: string): string {
  const parts = name
    .replace(/^(Dr|Prof|Mr|Mrs|Ms|Mx)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) {
    return 'AB';
  }
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : `${parts[0][0]}${parts.at(-1)![0]}`;
  return letters.toUpperCase();
}
