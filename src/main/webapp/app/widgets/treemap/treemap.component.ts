import { OnChanges, Component, Input, EventEmitter, Output, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { NgxChartsModule } from '@swimlane/ngx-charts';
@Component({
    selector: 'hpd-treemap',
    templateUrl: './treemap.component.html',
    styleUrls: ['./treemap.component.scss'],
    imports: [NgxChartsModule],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class TreeMapComponent {
  @Input() isFiltered = true;
  @Input() data: TreeMap[] = [];
  @Output() dataSelected: EventEmitter<any> = new EventEmitter<any>();
  @Input() colorScheme = {
    domain: ['white', 'yellow', 'orange', 'red'],
  };
  @Input() view!: number[];
  @Input() customColors: any[] = [];

  onSelect(event: any): void {
    this.dataSelected.emit(event);
  }
}
export class TreeMap {
  name: string;
  value: any;
  data: any;
  constructor(name: string, value: number, data?: any) {
    this.name = name;
    this.value = value;
    this.data = data;
  }
}
