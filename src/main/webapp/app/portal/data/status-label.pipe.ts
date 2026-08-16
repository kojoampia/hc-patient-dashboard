import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

import { humanise } from './portal-format';

/**
 * A record's status in the words a patient uses, not the words the database uses.
 *
 *   <span class="hc-pill">{{ item.status | hpdStatus }}</span>
 *
 * The portal used to render every status through {@link humanise}, which sentence-cases the enum
 * and stops there: `HIGH` became "High", `TREATMENT` became "Treatment", `OK` became "Ok". Those
 * are the backend's words. On an emergency the difference is the whole point — a patient reads
 * **Urgent**, and "High" is a severity grading they were never shown the scale for.
 *
 * The enum values are unique across the domains the portal renders, so one flat map covers cases,
 * medications, appointments, emergencies, allergies and vitals. A value with no entry falls back
 * to `humanise`, so a status the backend adds tomorrow renders as words rather than as a missing
 * translation key.
 *
 * Impure, like `TranslatePipe` itself: the label has to change when the language does, and a pure
 * pipe would hold the one it was first given.
 */
@Pipe({
  name: 'hpdStatus',
  standalone: true,
  pure: false,
})
export class StatusLabelPipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  transform(value: string | null | undefined): string {
    if (!value) {
      return '—';
    }
    const key = `patientPortal.status.${value}`;
    const label: string = this.translate.instant(key);
    return label === key ? humanise(value) : label;
  }
}
