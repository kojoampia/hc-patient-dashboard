import { Component, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { IStat } from 'app/entities/patientMS/stat/stat.model';
import { StatComponent } from 'app/entities/patientMS/stat/list/stat.component';

@Component({
    selector: 'hpd-temperature',
    imports: [StatComponent],
    templateUrl: './temperature.component.html',
    styleUrl: './temperature.component.scss'
})
export class TemperatureComponent implements OnDestroy {
  private destroyed$ = new Subject<boolean>();
  public type = 'temperature';

  constructor(private modal: NgbActiveModal) {}

  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.unsubscribe();
  }

  close(): void {
    this.modal.dismiss();
  }
}
