import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IAllergy } from '../allergy.model';
import { AllergyService } from '../service/allergy.service';

@Component({
  standalone: true,
  templateUrl: './allergy-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class AllergyDeleteDialogComponent {
  allergy?: IAllergy;

  constructor(
    protected allergyService: AllergyService,
    protected activeModal: NgbActiveModal,
  ) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.allergyService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
