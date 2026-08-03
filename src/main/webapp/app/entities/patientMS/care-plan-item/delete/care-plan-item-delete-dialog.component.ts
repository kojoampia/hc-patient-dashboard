import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { ICarePlanItem } from '../care-plan-item.model';
import { CarePlanItemService } from '../service/care-plan-item.service';

@Component({
  standalone: true,
  templateUrl: './care-plan-item-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class CarePlanItemDeleteDialogComponent {
  carePlanItem?: ICarePlanItem;

  constructor(
    protected carePlanItemService: CarePlanItemService,
    protected activeModal: NgbActiveModal,
  ) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.carePlanItemService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
