import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IPersonalDocument } from '../personal-document.model';
import { PersonalDocumentService } from '../service/personal-document.service';

@Component({
  standalone: true,
  templateUrl: './personal-document-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class PersonalDocumentDeleteDialogComponent {
  personalDocument?: IPersonalDocument;

  constructor(
    protected personalDocumentService: PersonalDocumentService,
    protected activeModal: NgbActiveModal,
  ) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.personalDocumentService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
