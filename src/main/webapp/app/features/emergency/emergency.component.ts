import { Component, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StatComponent } from 'app/entities/patientMS/stat/list/stat.component';
import { Subject } from 'rxjs';

@Component({
    selector: 'hpd-emergency',
    imports: [StatComponent],
    templateUrl: './emergency.component.html',
    styleUrl: './emergency.component.scss'
})
export class EmergencyComponent implements OnDestroy {
  private destroyed$ = new Subject<boolean>();
  public type = 'emergencies';

  constructor(private modal: NgbActiveModal) {}

  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.unsubscribe();
  }

  close(): void {
    this.modal.dismiss();
  }
}
