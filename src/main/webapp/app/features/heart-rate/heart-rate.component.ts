import { Component, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StatComponent } from 'app/entities/patientMS/stat/list/stat.component';
import { Subject } from 'rxjs';

@Component({
    selector: 'hpd-heart-rate',
    imports: [StatComponent],
    templateUrl: './heart-rate.component.html',
    styleUrl: './heart-rate.component.scss'
})
export class HeartRateComponent implements OnDestroy {
  private destroyed$ = new Subject<boolean>();
  public type = 'heartrate';

  constructor(private modal: NgbActiveModal) {}

  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.unsubscribe();
  }

  close(): void {
    this.modal.dismiss();
  }
}
