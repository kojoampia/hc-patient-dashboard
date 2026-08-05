import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IEmergency } from '../emergency.model';
import { EmergencyService } from '../service/emergency.service';

@Component({
    templateUrl: './emergency-delete-dialog.component.html',
    imports: [SharedModule, FormsModule]
})
export class EmergencyDeleteDialogComponent {
  emergency?: IEmergency;

  constructor(
    protected emergencyService: EmergencyService,
    protected activeModal: NgbActiveModal,
  ) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.emergencyService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
