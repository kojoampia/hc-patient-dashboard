import { Component, Input, OnInit, Output, EventEmitter, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { IMetricItem } from './metric-item.model';
import { Router } from '@angular/router';
import { NgxChartsModule } from '@swimlane/ngx-charts';

@Component({
  standalone: true,
  selector: 'jhi-metric-panel',
  templateUrl: './metric-panel.component.html',
  styleUrls: ['./metric-panel.component.scss'],
  imports: [NgxChartsModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class MetricPanelComponent implements OnInit {
  /* */
  @Input() metricItems?: IMetricItem[];

  /* */
  @Input() view = [];

  /* */
  @Input() colorScheme = {
    domain: ['#5AA454', '#E44D25', '#CFC0BB', '#7aa3e5'],
  };

  /* */
  @Input() animations = true;

  /* */
  @Input() cardColor = '#232837';

  /* */
  @Input() bandColor = '';

  /* */
  @Input() textColor = '';

  /* */
  @Input() innerPadding = 15;

  @Output() selectedItem: EventEmitter<any> = new EventEmitter<any>();

  constructor(private router: Router) {}

  ngOnInit(): void {}

  onSelect(item: any): void {
    this.selectedItem.emit(item);
    if ((item as IMetricItem).label === 'customers') {
      this.router.navigate(['/visitors/customers']);
    } else if ((item as IMetricItem).label === 'applications') {
      this.router.navigate(['/sales/application']);
    } else if ((item as IMetricItem).label === 'claims') {
      this.router.navigate(['/claims']);
    }
  }
}
