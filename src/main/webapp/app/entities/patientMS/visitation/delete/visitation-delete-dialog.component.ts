import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IVisitation } from '../visitation.model';
import { VisitationService } from '../service/visitation.service';

@Component({
  standalone: true,
  templateUrl: './visitation-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class VisitationDeleteDialogComponent {
  visitation?: IVisitation;

  constructor(
    protected visitationService: VisitationService,
    protected activeModal: NgbActiveModal,
  ) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.visitationService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
