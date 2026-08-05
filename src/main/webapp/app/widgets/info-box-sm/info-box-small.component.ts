import { Component, Input, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import SharedModule from 'app/shared/shared.module';

@Component({
    selector: 'hpd-info-box-small',
    templateUrl: './info-box-small.component.html',
    styleUrls: ['./info-box-small.component.scss'],
    imports: [SharedModule],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class InfoBoxSmallComponent {
  @Input() info?: any;
  @Input() title?: string;
  @Output() infoSelected: EventEmitter<any> = new EventEmitter();
  constructor() {}

  select(item: any): void {
    this.infoSelected.emit(item);
  }
}
