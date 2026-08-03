import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IActivityLog } from '../activity-log.model';
import { ActivityLogService } from '../service/activity-log.service';

@Component({
  standalone: true,
  templateUrl: './activity-log-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class ActivityLogDeleteDialogComponent {
  activityLog?: IActivityLog;

  constructor(
    protected activityLogService: ActivityLogService,
    protected activeModal: NgbActiveModal,
  ) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.activityLogService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
