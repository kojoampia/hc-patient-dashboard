import { Component, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StatComponent } from 'app/entities/patientMS/stat/list/stat.component';
import { Subject } from 'rxjs';

@Component({
    selector: 'hpd-allergy',
    imports: [StatComponent],
    templateUrl: './allergy.component.html',
    styleUrl: './allergy.component.scss'
})
export class AllergyComponent implements OnDestroy {
  private destroyed$ = new Subject<boolean>();
  public type = 'allergies';

  constructor(private modal: NgbActiveModal) {}

  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.unsubscribe();
  }

  close(): void {
    this.modal.dismiss();
  }
}
