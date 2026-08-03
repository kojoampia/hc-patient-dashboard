import { Component, OnDestroy } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { StatComponent } from 'app/entities/patientMS/stat/list/stat.component';
import { Subject } from 'rxjs';

@Component({
  selector: 'hpd-sugar',
  standalone: true,
  imports: [StatComponent],
  templateUrl: './sugar.component.html',
  styleUrl: './sugar.component.scss',
})
export class SugarComponent implements OnDestroy {
  private destroyed$ = new Subject<boolean>();
  public type = 'sugar';

  constructor(private modal: NgbActiveModal) {}

  ngOnDestroy(): void {
    this.destroyed$.next(true);
    this.destroyed$.unsubscribe();
  }

  close(): void {
    this.modal.dismiss();
  }
}
