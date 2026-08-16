import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

import SharedModule from 'app/shared/shared.module';
import { CareTeamMember } from 'app/portal/data/patient-context.service';

/**
 * "Whose?" — the filter that answers *what has this clinician seen me about*.
 *
 *   <hpd-person-filter [people]="careTeam()" [value]="professional()" (valueChange)="setProfessional($event)" />
 *
 * A select rather than the chip row the status filters use: the care team runs to six people with
 * names like "Kwabena Adda Frimpong", and six chips of that length wrap the tools row onto three
 * lines on a laptop. Chips stay right for the three or four short, fixed options a status has.
 *
 * Empty string is "everyone" — it is what a native select gives for an option with no value, and
 * turning it into null here keeps that detail out of every screen that uses this.
 */
@Component({
  selector: 'hpd-person-filter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SharedModule],
  template: `
    <label class="hc-select">
      <span class="hc-sr-only">{{ 'patientPortal.filter.professional' | translate }}</span>
      <select [value]="value ?? ''" (change)="onChange($event)">
        <option value="">{{ 'patientPortal.filter.allProfessionals' | translate }}</option>
        @for (person of people; track person.id) {
          <option [value]="person.id">{{ person.name }}</option>
        }
      </select>
    </label>
  `,
})
export class PersonFilterComponent {
  @Input({ required: true }) people: readonly CareTeamMember[] = [];

  /** The selected professional's id, or null for everyone. */
  @Input() value: string | null = null;

  @Output() readonly valueChange = new EventEmitter<string | null>();

  onChange(event: Event): void {
    const selected = (event.target as HTMLSelectElement).value;
    this.valueChange.emit(selected || null);
  }
}
