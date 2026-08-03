import { Component, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StatComponent } from 'app/entities/patientMS/stat/list/stat.component';
import { Subject } from 'rxjs';

@Component({
  selector: 'hpd-blood-pressure',
  standalone: true,
  imports: [StatComponent],
  templateUrl: './blood-pressure.component.html',
  styleUrl: './blood-pressure.component.scss',
})
export class BloodPressureComponent implements OnDestroy {
  private destroyed$ = new Subject<boolean>();
  public type = 'pressure';

  constructor(private modal: NgbActiveModal) {}

  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.unsubscribe();
  }

  close(): void {
    this.modal.dismiss();
  }
}
