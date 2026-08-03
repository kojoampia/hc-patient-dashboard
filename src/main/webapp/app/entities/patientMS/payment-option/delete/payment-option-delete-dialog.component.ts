import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import SharedModule from 'app/shared/shared.module';
import { ITEM_DELETED_EVENT } from 'app/config/navigation.constants';
import { IPaymentOption } from '../payment-option.model';
import { PaymentOptionService } from '../service/payment-option.service';

@Component({
  standalone: true,
  templateUrl: './payment-option-delete-dialog.component.html',
  imports: [SharedModule, FormsModule],
})
export class PaymentOptionDeleteDialogComponent {
  paymentOption?: IPaymentOption;

  constructor(
    protected paymentOptionService: PaymentOptionService,
    protected activeModal: NgbActiveModal,
  ) {}

  cancel(): void {
    this.activeModal.dismiss();
  }

  confirmDelete(id: string): void {
    this.paymentOptionService.delete(id).subscribe(() => {
      this.activeModal.close(ITEM_DELETED_EVENT);
    });
  }
}
