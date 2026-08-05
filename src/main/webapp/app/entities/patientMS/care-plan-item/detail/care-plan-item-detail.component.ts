import { Component, Input } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

import SharedModule from 'app/shared/shared.module';
import { DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe } from 'app/shared/date';
import { ICarePlanItem } from '../care-plan-item.model';

@Component({
    selector: 'hpd-care-plan-item-detail',
    templateUrl: './care-plan-item-detail.component.html',
    imports: [SharedModule, RouterModule, DurationPipe, FormatMediumDatetimePipe, FormatMediumDatePipe]
})
export class CarePlanItemDetailComponent {
  @Input() carePlanItem: ICarePlanItem | null = null;

  constructor(protected activatedRoute: ActivatedRoute) {}

  previousState(): void {
    window.history.back();
  }
}
