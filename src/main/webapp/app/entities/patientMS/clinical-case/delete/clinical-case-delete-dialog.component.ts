import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IClinicalCase } from '../clinical-case.model';
import { ClinicalCaseService } from '../service/clinical-case.service';

@Component({
  standalone: true,
  templateUrl: './clinical-case-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class ClinicalCaseDeleteDialogComponent {
  clinicalCase?: IClinicalCase;

  constructor(
    protected clinicalCaseService: ClinicalCaseService,
    protected activeModal: NgbActiveModal,
  ) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.clinicalCaseService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
