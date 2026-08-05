import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IRecommendation } from '../recommendation.model';
import { RecommendationService } from '../service/recommendation.service';

@Component({
    templateUrl: './recommendation-delete-dialog.component.html',
    imports: [SharedModule, FormsModule]
})
export class RecommendationDeleteDialogComponent {
  recommendation?: IRecommendation;

  constructor(
    protected recommendationService: RecommendationService,
    protected activeModal: NgbActiveModal,
  ) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.recommendationService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
